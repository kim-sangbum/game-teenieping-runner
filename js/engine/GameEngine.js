/**
 * GameEngine.js
 * 하이퍼 캐주얼 러닝 게임 코어 엔진
 * 
 * - 2.5D 원근 투영 (Perspective Projection) 러닝 트랙
 * - 스와이프 / 마우스 드래그를 통한 좌우 군단 이동
 * - 사칙연산 게이트 판정 및 인원 증감 (소수점 버림)
 * - 동적 장애물 충돌 판정 및 인원 감소
 * - 게임 오버 판정 (0명 이하)
 * - 엔딩 페이즈: 목적지 보상 계단 연속 소모 및 꼭대기 보물상자 연출
 */

import { DifficultyManager } from './DifficultyManager.js';
import { StickmanRenderer } from './StickmanRenderer.js';
import { ParticleSystem } from './ParticleSystem.js';
import { sound } from './SoundFx.js';

export const GameState = {
  READY: 'READY',
  RUNNING: 'RUNNING',
  STAIR_PHASE: 'STAIR_PHASE',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER'
};

export class GameEngine {
  constructor(canvas, onGameEndCallback, onHudUpdateCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onGameEnd = onGameEndCallback || (() => { });
    this.onHudUpdate = onHudUpdateCallback || (() => { });

    this.renderer = new StickmanRenderer();
    this.particles = new ParticleSystem();

    // 뷰포트 및 트랙 크기
    this.width = canvas.width;
    this.height = canvas.height;
    this.trackWidth = 240; // 좌우 폭 (-120 ~ +120)
    this.trackLength = 3200; // 출발지에서 계단 전까지 거리

    // 플레이어 군단 상태
    this.playerX = 0; // 중심 좌우 위치 (-trackWidth/2 ~ +trackWidth/2)
    this.targetPlayerX = 0;
    this.playerZ = 0; // 전진 거리
    this.crowdCount = 1; // 시작 시 1명
    this.stickmanColor = '#00d2ff'; // 유저 커스터마이징 스킨 컬러

    // 게임 루프 및 물리
    this.state = GameState.READY;
    this.lastTime = 0;
    this.runTimer = 0;
    this.config = null;
    this.stage = 1;
    this.age = 8;

    // 조작 제어
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragPlayerStartX = 0;
    this.keys = { left: false, right: false };

    // 기믹 및 엔딩 계단 데이터
    this.gates = [];
    this.obstacles = [];
    this.stairs = [];
    this.stairIndex = 0;
    this.stairTimer = 0;
    this.stairHopProgress = 0;
    this.chestOpened = false;

    this._bindEvents();
  }

  /**
   * 캔버스 리사이즈 대응
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * 새 라운드 시작 초기화
   */
  startLevel(user, stage = 1) {
    this.stage = stage;
    this.age = user ? user.age : 8;
    this.config = DifficultyManager.getConfig(this.age, this.stage);

    // 유저 스킨 컬러 반영 (Phase 1 룰: 그래픽 리소스 대신 색상만 반영)
    this.stickmanColor = '#00d2ff';
    if (user && user.customization && user.customization.skinTone) {
      // CustomizationSchema의 스킨톤 컬러가 매핑됨
      const skinMap = {
        skin_default: '#00d2ff',
        skin_peach: '#ffb088',
        skin_lemon: '#ffe600',
        skin_rose: '#ff4b8b',
        skin_obsidian: '#2a2a38'
      };
      this.stickmanColor = skinMap[user.customization.skinTone] || '#00d2ff';
    }

    // 기본 초기화
    this.playerX = 0;
    this.targetPlayerX = 0;
    this.playerZ = 0;
    this.crowdCount = 1; // [요구사항] 1명의 캐릭터로 시작
    this.state = GameState.RUNNING;
    this.runTimer = 0;
    this.chestOpened = false;
    this.stairIndex = 0;
    this.stairTimer = 0;
    this.keys = { left: false, right: false };
    this.particles.reset();

    // 트랙 오브젝트 생성
    this._generateTrack();

    // HUD 초기화 통지
    this.onHudUpdate({
      count: this.crowdCount,
      progress: 0,
      stage: this.stage,
      targetGoal: this.config.targetCrowdGoal
    });
  }

  /**
   * 트랙 상의 사칙연산 게이트 및 장애물 배치
   */
  _generateTrack() {
    this.gates = [];
    this.obstacles = [];
    this.stairs = [];

    const { gatePairsCount, obstacleSpawnRate, stairStepsCount } = this.config;
    const gateInterval = this.trackLength / (gatePairsCount + 1);

    // 1. 게이트 쌍 생성
    for (let i = 1; i <= gatePairsCount; i++) {
      const z = i * gateInterval;
      const pair = DifficultyManager.generateGatePair(this.age, this.stage, i);
      this.gates.push({
        id: `gate_${i}`,
        z,
        left: { ...pair.left, passed: false },
        right: { ...pair.right, passed: false },
        passed: false
      });

      // 2. 게이트 사이에 장애물 배치 (일정 확률)
      if (Math.random() < obstacleSpawnRate && i < gatePairsCount) {
        const obsZ = z + gateInterval * 0.5;
        const type = Math.random() < 0.5 ? 'moving_pillar' : 'spikes';
        this.obstacles.push({
          id: `obs_${i}`,
          z: obsZ,
          type,
          x: (Math.random() - 0.5) * (this.trackWidth * 0.5),
          width: 38,
          depth: 25,
          speed: 1.5 + Math.random() * 1.5,
          dir: Math.random() < 0.5 ? 1 : -1,
          hitCooldown: 0
        });
      }
    }

    // 3. 목적지 보상 계단 생성
    const stairBaseZ = this.trackLength + 100;
    const stepDepth = 90;
    for (let s = 0; s < stairStepsCount; s++) {
      const multiplier = 1.0 + (s + 1) * 0.5; // 계단별 배율: x1.5, x2.0, x2.5...
      this.stairs.push({
        index: s,
        z: stairBaseZ + s * stepDepth,
        multiplier,
        cleared: false
      });
    }

    // 꼭대기 보물상자 플랫폼 Z
    this.goalPlatformZ = stairBaseZ + stairStepsCount * stepDepth;
  }

  // --- 입력 이벤트 바인딩 (터치 & 마우스 완벽 지원) ---
  _bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const onPointerDown = (e) => {
      if (this.state !== GameState.RUNNING) return;
      this.isDragging = true;
      const pos = getPos(e);
      this.dragStartX = pos.x;
      this.dragPlayerStartX = this.targetPlayerX;
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.state !== GameState.RUNNING) return;
      const pos = getPos(e);
      const deltaX = pos.x - this.dragStartX;
      const lateralSensitivity = 0.9;
      const halfWidth = (this.trackWidth / 2) - 15;
      this.targetPlayerX = Math.max(-halfWidth, Math.min(halfWidth, this.dragPlayerStartX + deltaX * lateralSensitivity));
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    // 키보드 좌우 화살표 키 및 A/D 키 조작 (마우스/터치와 동시 완벽 지원)
    const onKeyDown = (e) => {
      if (this.state !== GameState.RUNNING) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
        e.preventDefault();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
        e.preventDefault();
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  // --- 메인 업데이트 루프 ---
  update(dt) {
    if (this.state === GameState.READY) return;

    this.runTimer += dt;
    this.particles.update(dt);

    // 부드러운 좌우 이동 보간 (Lerp)
    this.playerX += (this.targetPlayerX - this.playerX) * Math.min(1, dt * 14);

    // 1. 러닝 주행 페이즈
    if (this.state === GameState.RUNNING) {
      // 키보드 좌우 조작 처리 (마우스/터치 드래그와 동시 지원)
      const halfWidth = (this.trackWidth / 2) - 15;
      const lateralSpeed = (this.config && this.config.lateralSpeed) ? this.config.lateralSpeed : 420;

      if (this.keys.left) {
        this.targetPlayerX = Math.max(-halfWidth, this.targetPlayerX - lateralSpeed * dt);
      }
      if (this.keys.right) {
        this.targetPlayerX = Math.min(halfWidth, this.targetPlayerX + lateralSpeed * dt);
      }

      this.playerZ += this.config.forwardSpeed * dt;

      // HUD 업데이트
      const progress = Math.min(100, Math.floor((this.playerZ / this.trackLength) * 100));
      this.onHudUpdate({
        count: this.crowdCount,
        progress,
        stage: this.stage,
        targetGoal: this.config.targetCrowdGoal
      });

      // 게이트 충돌 판정
      this._checkGateCollisions();

      // 장애물 충돌 판정
      this._updateAndCheckObstacles(dt);

      // 종점(계단 진입점) 도달 체크
      if (this.playerZ >= this.trackLength) {
        this.state = GameState.STAIR_PHASE;
        this.stairIndex = 0;
        this.stairTimer = 0;
        this.targetPlayerX = 0; // 계단은 중앙으로 진입
      }

      // 게임 오버 체크 (인원 0명 이하)
      if (this.crowdCount <= 0) {
        this._triggerGameOver();
      }
    }

    // 2. 계단 소모 엔딩 페이즈
    else if (this.state === GameState.STAIR_PHASE) {
      this._updateStairPhase(dt);
    }
  }

  /**
   * 사칙연산 게이트 판정
   */
  _checkGateCollisions() {
    const crowdRadius = this.renderer.getCrowdRadius(this.crowdCount, 1.0);
    const triggerDistance = 20;

    for (const g of this.gates) {
      if (g.passed) continue;

      // 플레이어가 게이트 Z 라인에 도달했는지 확인
      if (this.playerZ >= g.z - triggerDistance && this.playerZ <= g.z + 40) {
        g.passed = true;

        // 플레이어 군단의 중심 X가 0보다 작으면 왼쪽 게이트, 크거나 같으면 오른쪽 게이트
        const chosenGate = this.playerX < 0 ? g.left : g.right;
        const prevCount = this.crowdCount;
        const newCount = DifficultyManager.evaluateGate(this.crowdCount, chosenGate.op, chosenGate.val);

        const diff = newCount - prevCount;
        this.crowdCount = newCount;

        // 텍스트 & 파티클 & 사운드
        const screenPos = this._project(this.playerX, g.z);
        if (diff >= 0) {
          sound.playGatePositive();
          this.particles.spawnFloatingText(screenPos.x, screenPos.y - 40, `+${diff} (${chosenGate.text})`, '#00ff88');
          this.particles.spawnBurst(screenPos.x, screenPos.y, 25, ['#00ff88', '#00d2ff', '#ffffff']);
        } else {
          sound.playGateNegative();
          this.particles.spawnFloatingText(screenPos.x, screenPos.y - 40, `${diff} (${chosenGate.text})`, '#ff4444');
          this.particles.spawnBurst(screenPos.x, screenPos.y, 20, ['#ff4444', '#ff8800']);
        }

        // 인원 0명 즉시 게임 오버
        if (this.crowdCount <= 0) {
          this._triggerGameOver();
          break;
        }
      }
    }
  }

  /**
   * 장애물 업데이트 및 충돌
   */
  _updateAndCheckObstacles(dt) {
    const crowdRadius = this.renderer.getCrowdRadius(this.crowdCount, 1.0);

    for (const obs of this.obstacles) {
      // 좌우 이동 장애물
      if (obs.type === 'moving_pillar') {
        obs.x += obs.dir * obs.speed * 40 * dt;
        const limit = (this.trackWidth / 2) - 25;
        if (obs.x > limit) { obs.x = limit; obs.dir = -1; }
        if (obs.x < -limit) { obs.x = -limit; obs.dir = 1; }
      }

      if (obs.hitCooldown > 0) {
        obs.hitCooldown -= dt;
      }

      // 플레이어와 Z축 충돌 범위
      const zDist = Math.abs(this.playerZ - obs.z);
      if (zDist < obs.depth + 15) {
        // X축 충돌 검사
        const xDist = Math.abs(this.playerX - obs.x);
        if (xDist < (obs.width / 2 + crowdRadius) && obs.hitCooldown <= 0) {
          obs.hitCooldown = 0.4; // 연속 피격 방지 쿨다운
          sound.playObstacleHit();

          // 충돌 시 인원 감소 (피격 규모에 따라 3명 ~ 8명 차감)
          const loss = Math.min(this.crowdCount, 3 + Math.floor(Math.random() * 4));
          this.crowdCount = Math.max(0, this.crowdCount - loss);

          const screenPos = this._project(this.playerX, obs.z);
          this.particles.spawnFloatingText(screenPos.x, screenPos.y - 30, `-${loss}`, '#ff3333');
          this.particles.spawnBurst(screenPos.x, screenPos.y, 15, ['#ff3333', '#888888']);

          if (this.crowdCount <= 0) {
            this._triggerGameOver();
            break;
          }
        }
      }
    }
  }

  /**
   * [엔딩 페이즈] 계단 소모 및 보상 정산
   */
  _updateStairPhase(dt) {
    this.stairTimer += dt;
    const stepInterval = 0.55; // 계단 1칸 뛰어오르는 주기(초)

    if (this.stairTimer >= stepInterval) {
      this.stairTimer = 0;

      // 아직 계단이 남아 있는 경우
      if (this.stairIndex < this.stairs.length) {
        const currentStair = this.stairs[this.stairIndex];
        const cost = this.config.stairCostPerStep;

        if (this.crowdCount > cost) {
          // 계단 1칸 성공적으로 정복!
          this.crowdCount -= cost;
          currentStair.cleared = true;
          this.playerZ = currentStair.z;
          this.stairIndex++;

          sound.playStairStep(1.0 + this.stairIndex * 0.1);
          const screenPos = this._project(0, currentStair.z);
          this.particles.spawnFloatingText(screenPos.x, screenPos.y - 40, `-${cost} (Step ${this.stairIndex})`, '#ffe600');
          this.particles.spawnBurst(screenPos.x, screenPos.y, 12, ['#ffe600', '#00d2ff']);
        } else {
          // 인원이 부족하여 여기서 계단 오르기 종료 (부분 클리어)
          this.state = GameState.VICTORY;
          this._finalizeRun(false);
          return;
        }
      } else {
        // 모든 계단 칸을 전부 돌파하고 꼭대기 골 플랫폼 도달! (최고 승리)
        this.playerZ = this.goalPlatformZ;
        this.state = GameState.VICTORY;
        this._finalizeRun(true);
        return;
      }
    }
  }

  /**
   * 라운드 종료 및 보상 정산
   */
  _finalizeRun(reachedTop) {
    const finalCount = this.crowdCount;
    const reachedSteps = this.stairIndex;
    const maxSteps = this.stairs.length;
    const lastStair = reachedSteps > 0 ? this.stairs[reachedSteps - 1] : null;
    const multiplier = lastStair ? lastStair.multiplier : 1.0;

    // 점수 = 남은 인원수 * 도달 배율
    const score = Math.floor(finalCount * multiplier);

    // 보상 계산
    let goldEarned = Math.floor(100 + score * 3);
    let gemsEarned = reachedTop ? 5 + Math.floor(finalCount / 15) : Math.max(1, Math.floor(reachedSteps / 2));

    if (reachedTop) {
      this.chestOpened = true;
      sound.playVictoryFanfare();
      const screenPos = this._project(0, this.goalPlatformZ);
      this.particles.spawnConfetti(screenPos.x, screenPos.y - 50, 70);
    }

    // 결과 알림 콜백 (1.2초 후 모달 표출)
    setTimeout(() => {
      this.onGameEnd({
        success: reachedSteps > 0,
        reachedTop,
        finalCount,
        reachedSteps,
        maxSteps,
        multiplier,
        score,
        goldEarned,
        gemsEarned,
        stage: this.stage
      });
    }, 1200);
  }

  /**
   * 게임 오버 처리
   */
  _triggerGameOver() {
    this.state = GameState.GAME_OVER;
    sound.playGateNegative();
    const screenPos = this._project(this.playerX, this.playerZ);
    this.particles.spawnFloatingText(screenPos.x, screenPos.y - 30, 'GAME OVER', '#ff0033');

    setTimeout(() => {
      this.onGameEnd({
        success: false,
        reachedTop: false,
        finalCount: 0,
        reachedSteps: 0,
        maxSteps: this.stairs.length,
        multiplier: 1.0,
        score: 0,
        goldEarned: 10, // 참가상
        gemsEarned: 0,
        stage: this.stage
      });
    }, 1000);
  }

  // --- 2.5D 카메라 원근 투영 수학 ---
  /**
   * 월드 좌표 (x, z)를 화면 2D (screenX, screenY) 및 scale로 변환
   */
  _project(worldX, worldZ) {
    const relativeZ = worldZ - this.playerZ;
    const cameraHeight = 160;
    const cameraDistance = 240;
    const horizonY = this.height * 0.35; // 소실점 높이

    // Z가 카메라 바로 뒤거나 너무 멀 때
    const effectiveZ = Math.max(1, relativeZ + cameraDistance);
    const scale = cameraDistance / effectiveZ;

    const screenX = this.width / 2 + worldX * scale;
    const groundY = this.height * 0.78;
    const screenY = horizonY + (groundY - horizonY) * scale;

    return { x: screenX, y: screenY, scale };
  }

  // --- 렌더링 루프 ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 역동적인 그라디언트 배경 (하늘 & 사이버 런웨이 지평선)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0d1117');
    bgGrad.addColorStop(0.38, '#161b22');
    bgGrad.addColorStop(1, '#090d13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. 2.5D 트랙 바닥 렌더링
    this._renderTrackFloor(ctx);

    // 3. 트랙 오브젝트 (게이트, 장애물, 계단) Z 깊이 역순 렌더링
    this._renderWorldObjects(ctx);

    // 4. 플레이어 졸라맨 군단 렌더링
    this._renderPlayerCrowd(ctx);

    // 5. 파티클 및 부유 텍스트
    this.particles.render(ctx);
  }

  /**
   * 원근감 있는 트랙 바닥 렌더링
   */
  _renderTrackFloor(ctx) {
    const horizonY = this.height * 0.35;
    const farZ = this.playerZ + 900;
    const nearZ = this.playerZ - 100;

    const pNearL = this._project(-this.trackWidth / 2, nearZ);
    const pNearR = this._project(this.trackWidth / 2, nearZ);
    const pFarL = this._project(-this.trackWidth / 2, farZ);
    const pFarR = this._project(this.trackWidth / 2, farZ);

    // 도로 바닥
    ctx.beginPath();
    ctx.moveTo(pNearL.x, pNearL.y);
    ctx.lineTo(pFarL.x, pFarL.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.lineTo(pNearR.x, pNearR.y);
    ctx.closePath();

    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, this.height);
    roadGrad.addColorStop(0, '#1a1f2c');
    roadGrad.addColorStop(1, '#252d3d');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // 트랙 양옆 네온 가이드라인
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00d2ff';
    ctx.beginPath();
    ctx.moveTo(pNearL.x, pNearL.y);
    ctx.lineTo(pFarL.x, pFarL.y);
    ctx.moveTo(pNearR.x, pNearR.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.stroke();

    // 도로 격자 줄무늬 (속도감 표현)
    const stripeInterval = 80;
    const startStripe = Math.floor(nearZ / stripeInterval) * stripeInterval;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

    for (let z = startStripe; z <= farZ; z += stripeInterval) {
      const p1 = this._project(-this.trackWidth / 2, z);
      const p2 = this._project(this.trackWidth / 2, z);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  /**
   * 게이트, 장애물, 계단 오브젝트 렌더링
   */
  _renderWorldObjects(ctx) {
    // 깊이 정렬을 위해 오브젝트들을 배열에 수집
    const renderList = [];

    // 게이트들
    for (const g of this.gates) {
      if (g.z > this.playerZ - 100 && g.z < this.playerZ + 850) {
        renderList.push({ type: 'gate', z: g.z, data: g });
      }
    }

    // 장애물들
    for (const obs of this.obstacles) {
      if (obs.z > this.playerZ - 100 && obs.z < this.playerZ + 850) {
        renderList.push({ type: 'obstacle', z: obs.z, data: obs });
      }
    }

    // 계단들
    for (const stair of this.stairs) {
      if (stair.z > this.playerZ - 100 && stair.z < this.playerZ + 850) {
        renderList.push({ type: 'stair', z: stair.z, data: stair });
      }
    }

    // 꼭대기 플랫폼
    if (this.goalPlatformZ > this.playerZ - 100 && this.goalPlatformZ < this.playerZ + 850) {
      renderList.push({ type: 'goal_platform', z: this.goalPlatformZ });
    }

    // 먼 것부터 먼저 렌더링 (Z 역순 정렬)
    renderList.sort((a, b) => b.z - a.z);

    for (const item of renderList) {
      if (item.type === 'gate') {
        this._drawGatePair(ctx, item.data);
      } else if (item.type === 'obstacle') {
        this._drawObstacle(ctx, item.data);
      } else if (item.type === 'stair') {
        this._drawStairStep(ctx, item.data);
      } else if (item.type === 'goal_platform') {
        this._drawGoalPlatform(ctx, item.z);
      }
    }
  }

  /**
   * 사칙연산 게이트 드로잉
   */
  _drawGatePair(ctx, gate) {
    const z = gate.z;
    const pCenter = this._project(0, z);
    const pLeft = this._project(-this.trackWidth * 0.25, z);
    const pRight = this._project(this.trackWidth * 0.25, z);
    const scale = pCenter.scale;

    const panelW = (this.trackWidth * 0.46) * scale;
    const panelH = 75 * scale;

    // 통과 완료된 게이트는 반투명 처리
    ctx.save();
    if (gate.passed) {
      ctx.globalAlpha = 0.3;
    }

    // 1. 왼쪽 게이트 패널
    this._drawSingleGatePanel(ctx, pLeft.x, pLeft.y, panelW, panelH, gate.left);

    // 2. 오른쪽 게이트 패널
    this._drawSingleGatePanel(ctx, pRight.x, pRight.y, panelW, panelH, gate.right);

    ctx.restore();
  }

function safeRoundRect(ctx, x, y, w, h, r = 6) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

_drawSingleGatePanel(ctx, cx, cy, w, h, gateInfo) {
  const isPositive = gateInfo.op === '+' || gateInfo.op === '*';
  const mainColor = isPositive ? '#00b4d8' : '#e63946';
  const bgColor = isPositive ? 'rgba(0, 180, 216, 0.45)' : 'rgba(230, 57, 70, 0.45)';

  // 패널 기둥/프레임
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = Math.max(1.5, 3 * (w / 100));

  ctx.beginPath();
  safeRoundRect(ctx, cx - w / 2, cy - h, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // 상단 텍스트
  const fontSize = Math.max(12, Math.floor(22 * (w / 90)));
  ctx.font = `900 ${fontSize}px "Noto Sans KR", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 8;
  ctx.fillText(gateInfo.text, cx, cy - h / 2);

  ctx.restore();
}

/**
 * 장애물 드로잉
 */
_drawObstacle(ctx, obs) {
  const proj = this._project(obs.x, obs.z);
  const scale = proj.scale;
  const w = obs.width * scale;
  const h = 45 * scale;

  ctx.save();
  ctx.translate(proj.x, proj.y);

  if (obs.type === 'moving_pillar') {
    // 기둥 장애물
    ctx.fillStyle = '#e63946';
    ctx.strokeStyle = '#ffbe0b';
    ctx.lineWidth = 2 * scale;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeRect(-w / 2, -h, w, h);

    // 경고 패턴 선
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h * 0.5);
    ctx.lineTo(w / 2, -h * 0.5);
    ctx.stroke();
  } else {
    // 회전 스파이크/함정
    ctx.fillStyle = '#9b5de5';
    ctx.beginPath();
    ctx.arc(0, -h * 0.4, w * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f15bb5';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 계단 단 드로잉
 */
_drawStairStep(ctx, stair) {
  const proj = this._project(0, stair.z);
  const scale = proj.scale;
  const w = this.trackWidth * 0.85 * scale;
  const h = 28 * scale;

  ctx.save();
  ctx.fillStyle = stair.cleared ? '#ffe600' : '#4a5568';
  ctx.strokeStyle = stair.cleared ? '#ffffff' : '#718096';
  ctx.lineWidth = 2 * scale;

  // 계단 블록
  ctx.beginPath();
  safeRoundRect(ctx, proj.x - w / 2, proj.y - h, w, h, 4);
  ctx.fill();
  ctx.stroke();

  // 배율 라벨 (x1.5, x2.0...)
  const fontSize = Math.max(10, Math.floor(14 * scale));
  ctx.font = `800 ${fontSize}px "Noto Sans KR", sans-serif`;
  ctx.fillStyle = stair.cleared ? '#000000' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`×${stair.multiplier.toFixed(1)}`, proj.x, proj.y - h / 2);

  ctx.restore();
}

/**
 * 계단 꼭대기 골 플랫폼 & 보물상자
 */
_drawGoalPlatform(ctx, z) {
  const proj = this._project(0, z);
  const scale = proj.scale;
  const w = this.trackWidth * 1.1 * scale;
  const h = 40 * scale;

  ctx.save();
  ctx.fillStyle = '#ffd166';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * scale;

  // 골 단상
  ctx.beginPath();
  safeRoundRect(ctx, proj.x - w / 2, proj.y - h, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // 보물상자 드로잉
  const chestW = 40 * scale;
  const chestH = 30 * scale;
  const chestX = proj.x;
  const chestY = proj.y - h - 5 * scale;

  // 상자 본체
  ctx.fillStyle = '#b07d62';
  ctx.fillRect(chestX - chestW / 2, chestY - chestH, chestW, chestH);

  // 상자 뚜껑 (열림/닫힘 연출)
  if (this.chestOpened) {
    // 열린 뚜껑
    ctx.fillStyle = '#f4a261';
    ctx.fillRect(chestX - chestW / 2, chestY - chestH - 12 * scale, chestW, 10 * scale);
    // 번쩍이는 황금 보석 효과
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(chestX, chestY - chestH, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 닫힌 뚜껑
    ctx.fillStyle = '#f4a261';
    ctx.fillRect(chestX - chestW / 2, chestY - chestH, chestW, 12 * scale);
    // 열쇠구멍
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(chestX, chestY - chestH / 2, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 플레이어 졸라맨 군단 렌더링
 */
_renderPlayerCrowd(ctx) {
  if (this.crowdCount <= 0 && this.state !== GameState.GAME_OVER) return;

  // 플레이어 스크린 좌표
  const proj = this._project(this.playerX, this.playerZ);

  let stickmanState = 'running';
  if (this.state === GameState.VICTORY) {
    stickmanState = 'cheering';
  } else if (this.state === GameState.GAME_OVER) {
    stickmanState = 'fallen';
  }

  // 군단 드로잉 호출
  this.renderer.drawCrowd(
    ctx,
    proj.x,
    proj.y,
    Math.max(1, this.crowdCount),
    proj.scale,
    this.runTimer,
    this.stickmanColor,
    stickmanState
  );
}
}
