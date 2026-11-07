/**
 * GameEngine3D.js
 * Three.js 기반 하이퍼 캐주얼 러닝 3D 게임 엔진
 * 
 * - 완전한 WebGL 3D 씬, 조명, 그림자
 * - 3D 트랙 & 사칙연산 게이트
 * - 4종 3D 장애물: 망치, 톱니바퀴, 가시, 싱크홀
 * - 실제 입체 구조 3D 계단 (Staircase)
 * - 최종 계단 도착 시 가로(사이드뷰) 시점 전환 & 왼쪽에서 오른쪽으로 걸어가 보물상자를 여는 극적 연출
 */

import { DifficultyManager } from './DifficultyManager.js';
import { Stickman3D, CrowdManager3D } from './Stickman3D.js';
import { Obstacles3D } from './Obstacles3D.js';
import { sound } from './SoundFx.js';
import { ParticleSystem } from './ParticleSystem.js';

export const GameState = {
  READY: 'READY',
  RUNNING: 'RUNNING',
  STAIR_PHASE: 'STAIR_PHASE',
  CINEMATIC_CHEST: 'CINEMATIC_CHEST',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER'
};

export class GameEngine3D {
  constructor(canvasContainer, onGameEndCallback, onHudUpdateCallback) {
    this.container = canvasContainer;
    this.onGameEnd = onGameEndCallback || (() => { });
    this.onHudUpdate = onHudUpdateCallback || (() => { });

    this.THREE = window.THREE;
    if (!this.THREE) {
      console.error('Three.js is not loaded!');
    }

    // 뷰포트 크기
    this.width = this.container.clientWidth || 400;
    this.height = this.container.clientHeight || 700;

    // 트랙 3D 스펙 (1 유닛 = 약 1미터)
    this.trackWidth = 8.0;   // 트랙 좌우 폭 (-4.0 ~ +4.0)
    this.trackLength = 450.0; // [요구사항 1] 도로를 대폭 늘려 게임 플레이 타임을 풍성하게 연장 (220 -> 450)

    // 플레이어 군단 상태
    this.playerX = 0;
    this.targetPlayerX = 0;
    this.playerZ = 0;
    this.crowdCount = 1;
    this.stickmanColor = '#ff9ebb'; // [요구사항 2] 하츄핑 시그니처 핑크 기본 컬러

    this.state = GameState.READY;
    this.runTimer = 0;
    this.config = null;
    this.stage = 1;
    this.age = 8;

    // 조작
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragPlayerStartX = 0;
    this.keys = { left: false, right: false };

    // 3D 씬 오브젝트
    this.gates = [];
    this.obstacles = [];
    this.stairs = [];
    this.stairIndex = 0;
    this.stairTimer = 0;

    // 시네마틱 카메라 & 보물상자 연출
    this.cinematicTimer = 0;
    this.cinematicStage = 0;
    this.chestBoxMesh = null;
    this.chestLidMesh = null;
    this.chestLight = null;
    this.floatingCrown = null; // [요구사항 5] 상자에서 날아와 머리에 씌워질 왕관
    this.coins3D = [];
    this.shakeIntensity = 0;
    this.isPaused = false;

    // 2D 파티클/HUD 오버레이용
    this.particles = new ParticleSystem();

    this._initThreeScene();
    this._bindEvents();
  }

  // --- Three.js 초기화 ---
  _initThreeScene() {
    const THREE = this.THREE;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1017);
    this.scene.fog = new THREE.FogExp2(0x0c1017, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(54, this.width / this.height, 0.5, 350);
    this.cameraTarget = new THREE.Vector3(0, 1.5, 8);
    this.camera.position.set(0, 6.5, -7.5);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 캔버스 엘리먼트 추가
    this.renderer.domElement.id = 'game-webgl-canvas';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(10, 20, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 80;
    const d = 15;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // 5. 3D 군단 매니저
    this.crowdManager = new CrowdManager3D(THREE, this.scene, this.stickmanColor);
  }

  resize(width, height) {
    if (!width || !height || width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  // --- 레벨 시작 초기화 ---
  startLevel(user, stage = 1) {
    this.stage = stage;
    this.age = user ? user.age : 8;
    this.config = DifficultyManager.getConfig(this.age, this.stage);

    // 스킨톤 컬러 (티니핑 파스텔 테마)
    this.stickmanColor = '#ff9ebb';
    if (user && user.customization && user.customization.skinTone) {
      const skinMap = {
        skin_default: '#ff9ebb', // 하츄핑 시그니처 핑크
        skin_peach: '#ffcba4',   // 조아핑 웜 피치
        skin_lemon: '#ffe600',   // 방글핑 에너지 옐로우
        skin_rose: '#ff4b8b',    // 믿어핑 로즈 마젠타
        skin_obsidian: '#5c4d7d' // 시크 퍼플
      };
      this.stickmanColor = skinMap[user.customization.skinTone] || '#ff9ebb';
    }
    this.crowdManager.setColor(this.stickmanColor);

    // 상태 초기화
    this.playerX = 0;
    this.targetPlayerX = 0;
    this.playerZ = 0;
    this.crowdCount = 1;
    this.state = GameState.RUNNING;
    this.runTimer = 0;
    this.stairIndex = 0;
    this.stairTimer = 0;
    this.cinematicTimer = 0;
    this.cinematicStage = 0;
    this.keys = { left: false, right: false };
    this.particles.reset();

    if (this.crowdManager && this.crowdManager.crowdGroup) {
      this.crowdManager.crowdGroup.position.set(0, 0, 0);
      this.crowdManager.crowdGroup.rotation.set(0, 0, 0);
      for (const s of this.crowdManager.pool) {
        if (s.userData && s.userData.crownMesh) {
          s.userData.crownMesh.visible = false;
        }
      }
    }

    this.camera.position.set(0, 6.0, -8.5);
    this.cameraTarget.set(0, 1.2, 6.0);
    this.camera.lookAt(this.cameraTarget);

    // 3D 씬 재구축
    this._buildTrack3D();

    this.onHudUpdate({
      count: this.crowdCount,
      progress: 0,
      stage: this.stage,
      targetGoal: this.config.targetCrowdGoal
    });
  }

  // --- 3D 트랙, 게이트, 4종 장애물, 입체 계단 구축 ---
  _buildTrack3D() {
    const THREE = this.THREE;

    // 기존 동적 오브젝트 정리
    if (this.trackGroup) this.scene.remove(this.trackGroup);
    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);

    this.gates = [];
    this.obstacles = [];
    this.stairs = [];

    // 1. 메인 3D 활주로 바닥
    const roadGeo = new THREE.BoxGeometry(this.trackWidth, 0.4, this.trackLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.7,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, -0.2, this.trackLength / 2);
    road.receiveShadow = true;
    this.trackGroup.add(road);

    // 트랙 양옆 네온 가이드 레일
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x00d2ff,
      roughness: 0.2
    });
    const railGeo = new THREE.BoxGeometry(0.2, 0.35, this.trackLength);
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-this.trackWidth / 2, 0.05, this.trackLength / 2);
    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(this.trackWidth / 2, 0.05, this.trackLength / 2);
    this.trackGroup.add(leftRail);
    this.trackGroup.add(rightRail);

    // 2. [요구사항 2 해결] 계단 끝까지 완주 가능한 승리 경로가 100% 보장된 게이트 목록 생성
    const { gatePairsCount, obstacleSpawnRate, stairStepsCount } = this.config;
    const gateInterval = this.trackLength / (gatePairsCount + 1);
    const validatedGatePairs = DifficultyManager.generateValidatedTrackGates(this.age, this.stage);

    for (let i = 1; i <= gatePairsCount; i++) {
      const z = i * gateInterval;
      const pair = validatedGatePairs[i - 1] || DifficultyManager.generateGatePair(this.age, this.stage, i);

      // 게이트 3D 생성
      const gateMeshGroup = this._createGate3DMesh(pair, z);
      this.trackGroup.add(gateMeshGroup);

      this.gates.push({
        id: `gate_${i}`,
        z,
        left: { ...pair.left, passed: false },
        right: { ...pair.right, passed: false },
        meshGroup: gateMeshGroup,
        passed: false
      });

      // 게이트 사이에 4종 장애물 배치
      if (Math.random() < obstacleSpawnRate && i < gatePairsCount) {
        const obsZ = z + gateInterval * 0.52;
        const types = ['hammer', 'saw', 'spikes', 'sinkhole'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        let obsMesh;

        if (chosenType === 'hammer') {
          obsMesh = Obstacles3D.createHammer(THREE, 0, obsZ);
        } else if (chosenType === 'saw') {
          obsMesh = Obstacles3D.createSawBlade(THREE, 0, obsZ, this.trackWidth);
        } else if (chosenType === 'spikes') {
          const x = (Math.random() - 0.5) * (this.trackWidth * 0.5);
          obsMesh = Obstacles3D.createSpikes(THREE, x, obsZ);
        } else {
          // sinkhole
          const x = (Math.random() - 0.5) * (this.trackWidth * 0.4);
          obsMesh = Obstacles3D.createSinkhole(THREE, x, obsZ);
        }

        this.trackGroup.add(obsMesh);
        this.obstacles.push(obsMesh);
      }
    }

    // 3. [요구사항 4] 7색 무지개 3D 입체 계단 (7 Rainbow Steps)
    const stairBaseZ = this.trackLength + 4.0;
    const stepDepth = 5.0; // 1칸의 깊이
    const stepHeight = 0.85; // 1칸의 높이

    // 빨, 주, 노, 초, 파, 남, 보
    const rainbowColors = [
      0xff3355, // 1. 빨강 (Red)
      0xff8800, // 2. 주황 (Orange)
      0xffd200, // 3. 노랑 (Yellow)
      0x10d876, // 4. 초록 (Green)
      0x00a8ff, // 5. 파랑 (Blue)
      0x3742fa, // 6. 남색 (Indigo)
      0x9b51e0  // 7. 보라 (Violet)
    ];

    for (let s = 0; s < stairStepsCount; s++) {
      const multiplier = 1.0 + (s + 1) * 0.5;
      const stairZ = stairBaseZ + s * stepDepth;
      const stairY = (s + 1) * stepHeight;
      const stepColor = rainbowColors[s % rainbowColors.length];

      // 계단 블록 메시 (화사한 무지개 컬러 & 네온 발광)
      const stepGeo = new THREE.BoxGeometry(this.trackWidth * 0.92, stairY, stepDepth);
      const stepMat = new THREE.MeshStandardMaterial({
        color: stepColor,
        roughness: 0.35,
        metalness: 0.2,
        emissive: stepColor,
        emissiveIntensity: 0.28
      });
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(0, stairY / 2, stairZ + stepDepth / 2);
      stepMesh.receiveShadow = true;
      this.trackGroup.add(stepMesh);

      // 계단 윗면 네온 테두리
      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.trackWidth * 0.92, 0.05, stepDepth));
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const edge = new THREE.LineSegments(edgeGeo, edgeMat);
      edge.position.set(0, stairY + 0.03, stairZ + stepDepth / 2);
      this.trackGroup.add(edge);

      // 계단 앞면 배율 라벨 텍스처
      const labelSprite = this._createMultiplierSprite(`×${multiplier.toFixed(1)}`);
      labelSprite.position.set(0, stairY - 0.35, stairZ + 0.05);
      labelSprite.scale.set(3.2, 1.2, 1);
      this.trackGroup.add(labelSprite);

      // [요구사항 3] 계단 윗면(밟는 쪽) 차감 인원수 대형 라벨
      const treadLabel = this._createStairTreadCostLabel(this.config.stairCostPerStep, multiplier);
      treadLabel.position.set(0, stairY + 0.04, stairZ + stepDepth * 0.5);
      this.trackGroup.add(treadLabel);

      this.stairs.push({
        index: s,
        z: stairZ + stepDepth * 0.5,
        y: stairY,
        multiplier,
        color: stepColor,
        mesh: stepMesh,
        mat: stepMat,
        cleared: false
      });
    }

    // 4. [요구사항 5] 최종 계단 꼭대기 골 플랫폼 & 황금 보물상자
    const finalStairY = stairStepsCount * stepHeight;
    const goalPlatformZ = stairBaseZ + stairStepsCount * stepDepth;
    const goalPlatformLength = 22.0;

    // 넓은 평지 골 플랫폼
    const goalGeo = new THREE.BoxGeometry(this.trackWidth * 1.1, finalStairY, goalPlatformLength);
    const goalMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.4
    });
    const goalPlatform = new THREE.Mesh(goalGeo, goalMat);
    goalPlatform.position.set(0, finalStairY / 2, goalPlatformZ + goalPlatformLength / 2);
    goalPlatform.receiveShadow = true;
    this.trackGroup.add(goalPlatform);

    // 플랫폼 바닥 황금 네온 라인들 (이동 속도감 표현)
    for (let l = 1; l <= 6; l++) {
      const stripeGeo = new THREE.BoxGeometry(this.trackWidth * 0.95, 0.05, 0.4);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, finalStairY + 0.03, goalPlatformZ + l * 3.2);
      this.trackGroup.add(stripe);
    }

    // 황금 보물상자 3D 생성 (플랫폼의 오른쪽/끝자락)
    const chestZ = goalPlatformZ + 16.5;
    this._createTreasureChest3D(0, finalStairY, chestZ);

    this.goalPlatformZ = goalPlatformZ;
    this.goalPlatformY = finalStairY;
    this.chestZ = chestZ;
  }

  /**
   * 사칙연산 3D 게이트 메시 생성
   */
  _createGate3DMesh(pair, z) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    group.position.set(0, 0, z);

    const halfW = this.trackWidth / 4;
    const gateW = this.trackWidth * 0.46;
    const gateH = 3.6;

    // 카메라가 +Z를 볼 때: 3D 상에서 +X는 화면 왼쪽, -X는 화면 오른쪽!
    // 따라서 화면 왼쪽 패널(left)은 +halfW, 화면 오른쪽 패널(right)은 -halfW에 배치
    const leftMesh = this._createGatePanelMesh(pair.left, gateW, gateH);
    leftMesh.position.set(halfW, gateH / 2, 0);
    group.add(leftMesh);

    const rightMesh = this._createGatePanelMesh(pair.right, gateW, gateH);
    rightMesh.position.set(-halfW, gateH / 2, 0);
    group.add(rightMesh);

    group.userData = { leftMesh, rightMesh };
    return group;
  }

  _createGatePanelMesh(gateInfo, width, height) {
    const THREE = this.THREE;
    const group = new THREE.Group();

    const isPositive = gateInfo.op === '+' || gateInfo.op === '*';
    const mainColor = isPositive ? 0x00d2ff : 0xe63946;

    // 1. 반투명 네온 글래스 판넬
    const panelGeo = new THREE.BoxGeometry(width, height, 0.15);
    const panelMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.1,
      emissive: mainColor,
      emissiveIntensity: 0.3
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    group.add(panel);

    // 2. 네온 테두리 프레임
    const edges = new THREE.EdgesGeometry(panelGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    group.add(wireframe);

    // 3. 텍스트 스프라이트
    const sprite = this._createTextSprite(gateInfo.text, isPositive);
    sprite.position.set(0, 0, 0.12);
    sprite.scale.set(width * 0.85, height * 0.5, 1);
    group.add(sprite);

    group.userData = { panelMat };
    return group;
  }

  _createTextSprite(text, isPositive) {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 128);
    ctx.font = '900 68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 128, 64);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(mat);
  }

  _createMultiplierSprite(text) {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.font = '900 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 128, 48);

    ctx.fillStyle = '#ffe600';
    ctx.fillText(text, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  }

  /**
   * [요구사항 3] 계단 밟는 윗면에 배치되는 대형 소모 인원수 라벨
   */
  _createStairTreadCostLabel(cost, multiplier) {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 라운드 박스 다크 배경 & 네온 테두리
    ctx.fillStyle = 'rgba(16, 10, 28, 0.88)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 16, 480, 224, 28);
    } else {
      ctx.rect(16, 16, 480, 224);
    }
    ctx.fill();

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ff3366';
    ctx.stroke();

    // 1. 차감 인원수 (초대형 네온 골드)
    ctx.font = '900 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`🔻 -${cost}명`, 256, 92);

    ctx.fillStyle = '#ffe600';
    ctx.fillText(`🔻 -${cost}명`, 256, 92);

    // 2. 배율 라벨
    ctx.font = '800 50px sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`보너스 ×${multiplier.toFixed(1)}`, 256, 180);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`보너스 ×${multiplier.toFixed(1)}`, 256, 180);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(4.6, 2.3);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = -Math.PI / 2 + 0.16; // 윗면에 눕히되 카메라 쪽으로 살짝 기울임
    return mesh;
  }

  /**
   * 황금 보물상자 3D 모델
   */
  _createTreasureChest3D(x, y, z) {
    const THREE = this.THREE;
    const chestGroup = new THREE.Group();
    chestGroup.position.set(x, y, z);

    // 상자 본체
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      metalness: 0.3,
      roughness: 0.5
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      metalness: 0.85,
      roughness: 0.2
    });

    const bodyGeo = new THREE.BoxGeometry(2.4, 1.3, 1.6);
    this.chestBoxMesh = new THREE.Mesh(bodyGeo, chestMat);
    this.chestBoxMesh.position.y = 0.65;
    this.chestBoxMesh.castShadow = true;
    chestGroup.add(this.chestBoxMesh);

    // 금 테두리
    const trimGeo = new THREE.BoxGeometry(2.45, 0.2, 1.65);
    const trim = new THREE.Mesh(trimGeo, goldTrimMat);
    trim.position.y = 1.25;
    chestGroup.add(trim);

    // 상자 뚜껑 (열림 애니메이션용 피벗)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 1.3, 0.8); // 뒤쪽 힌지 위치

    const lidGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.4, 16, 1, false, 0, Math.PI);
    lidGeo.rotateZ(Math.PI / 2);
    lidGeo.translate(0, 0, -0.8);
    this.chestLidMesh = new THREE.Mesh(lidGeo, goldTrimMat);
    lidPivot.add(this.chestLidMesh);
    chestGroup.add(lidPivot);
    this.chestLidPivot = lidPivot;

    // 상자 내부 황금빛 포인트 라이트
    this.chestLight = new THREE.PointLight(0xffe600, 0, 15);
    this.chestLight.position.set(0, 1.8, 0);
    chestGroup.add(this.chestLight);

    // [요구사항 5] 상자에서 날아올라 머리에 씌워질 황금 로열 크라운
    this.floatingCrown = Stickman3D.createRoyalCrown(THREE);
    this.floatingCrown.position.set(0, 0.75, 0);
    this.floatingCrown.scale.set(1.4, 1.4, 1.4);
    this.floatingCrown.visible = false;
    chestGroup.add(this.floatingCrown);

    this.trackGroup.add(chestGroup);
    this.chestGroup = chestGroup;
  }

  // --- 입력 바인딩 ---
  _bindEvents() {
    const dom = this.renderer.domElement;

    const onPointerDown = (e) => {
      if (this.state !== GameState.RUNNING) return;
      this.isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      this.dragStartX = clientX;
      this.dragPlayerStartX = this.targetPlayerX;
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.state !== GameState.RUNNING) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - this.dragStartX;
      const sensitivity = 0.024; // 3D 단위 변환
      const halfLimit = this.trackWidth / 2 - 0.8;
      this.targetPlayerX = Math.max(-halfLimit, Math.min(halfLimit, this.dragPlayerStartX + deltaX * sensitivity));
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    // 키보드 조작
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
    if (this.state === GameState.READY || this.isPaused) return;

    this.runTimer += dt;
    this.particles.update(dt);

    // 장애물 4종 3D 애니메이션 업데이트
    for (const obs of this.obstacles) {
      Obstacles3D.updateObstacle(obs, dt, this.runTimer);
    }

    // 1. 달리기 주행 페이즈
    if (this.state === GameState.RUNNING) {
      // 키보드 조작
      const halfLimit = this.trackWidth / 2 - 0.8;
      const lateralSpeed = 9.0;
      if (this.keys.left) {
        this.targetPlayerX = Math.max(-halfLimit, this.targetPlayerX - lateralSpeed * dt);
      }
      if (this.keys.right) {
        this.targetPlayerX = Math.min(halfLimit, this.targetPlayerX + lateralSpeed * dt);
      }

      // X 보간 (부드러운 러닝)
      this.playerX += (this.targetPlayerX - this.playerX) * Math.min(1, dt * 14);

      // Z 전진
      const forward3DSpeed = this.config.forwardSpeed * 0.085;
      this.playerZ += forward3DSpeed * dt;

      // 카메라가 +Z를 볼 때 화면상 좌우와 일치시키기 위해 3D X좌표는 -playerX로 배치
      const worldX = -this.playerX;

      // 카메라 기본 백뷰 추적
      this.camera.position.set(worldX * 0.35, 6.0, this.playerZ - 8.5);
      this.cameraTarget.set(worldX * 0.7, 1.2, this.playerZ + 6.0);
      this.camera.lookAt(this.cameraTarget);

      // 광원 추적
      this.dirLight.position.set(worldX + 10, 20, this.playerZ + 10);
      this.dirLight.target.position.set(worldX, 0, this.playerZ);

      // 군단 3D 렌더 갱신
      this.crowdManager.updateCrowd(this.crowdCount, worldX, this.playerZ, this.runTimer, 'running');

      // 요정 별빛 가루 트레일 분출
      if (Math.random() < 0.35) {
        const screenPos = this._toScreenPos(worldX, 0.5, this.playerZ - 0.4);
        if (screenPos.visible) {
          this.particles.spawnFairyDust(screenPos.x, screenPos.y, 2);
        }
      }

      // HUD
      const progress = Math.min(100, Math.floor((this.playerZ / this.trackLength) * 100));
      this.onHudUpdate({
        count: this.crowdCount,
        progress,
        stage: this.stage,
        targetGoal: this.config.targetCrowdGoal
      });

      // 게이트 판정
      this._checkGateCollisions();

      // 장애물 판정
      this._checkObstacleCollisions(dt);

      // 계단 진입 체크
      if (this.playerZ >= this.trackLength) {
        this.state = GameState.STAIR_PHASE;
        this.stairIndex = 0;
        this.stairTimer = 0;
        this.targetPlayerX = 0;
      }

      if (this.crowdCount <= 0) {
        this._triggerGameOver();
      }
    }

    // 2. [요구사항 4] 3D 입체 계단 연속 소모 페이즈
    else if (this.state === GameState.STAIR_PHASE) {
      this._updateStairPhase(dt);
    }

    // 3. [요구사항 5] 최종 계단 도달: 가로 시점 전환 & 보물상자 열기 극적 연출
    else if (this.state === GameState.CINEMATIC_CHEST) {
      this._updateCinematicChest(dt);
    }

    else if (this.state === GameState.VICTORY) {
      // 승리 환호
      this.crowdManager.updateCrowd(this.crowdCount, this.playerX, this.playerZ, this.runTimer, 'cheering');
    }

    // 3D 황금 코인 파티클 업데이트
    this._update3DCoins(dt);

    // 카메라 화면 흔들림 (Screen Shake)
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
    }
  }

  /**
   * 3D 월드 좌표를 2D 화면 픽셀 좌표로 변환
   */
  _toScreenPos(worldX, worldY, worldZ) {
    if (!this.THREE || !this.camera) return { x: this.width / 2, y: this.height / 2, visible: true };
    const v = new this.THREE.Vector3(worldX, worldY, worldZ);
    v.project(this.camera);
    const isInFront = v.z >= -1.0 && v.z <= 1.0;
    const x = isInFront ? (v.x * 0.5 + 0.5) * this.width : this.width / 2;
    const y = isInFront ? (-v.y * 0.5 + 0.5) * this.height : this.height * 0.55;
    return { x, y, visible: true };
  }

  // --- 게이트 충돌 판정 ---
  _checkGateCollisions() {
    for (const g of this.gates) {
      if (g.passed) continue;

      if (this.playerZ >= g.z - 1.0 && this.playerZ <= g.z + 2.5) {
        g.passed = true;
        g.meshGroup.visible = false; // 통과 후 사라짐

        const chosenGate = this.playerX < 0 ? g.left : g.right;
        const prevCount = this.crowdCount;
        const newCount = DifficultyManager.evaluateGate(this.crowdCount, chosenGate.op, chosenGate.val);

        const diff = newCount - prevCount;
        this.crowdCount = newCount;

        const screenPos = this._toScreenPos(-this.playerX, 2.4, this.playerZ);
        if (diff >= 0) {
          sound.playGatePositive();
          this.shakeIntensity = 0.12;
          this.particles.spawnBurst(screenPos.x, screenPos.y, 25, ['#00d2ff', '#ffffff', '#00ff88']);
          if (screenPos.visible && diff > 0) {
            this.particles.spawnFloatingText(screenPos.x, screenPos.y - 20, `+${diff}`, '#00ff88');
          }
        } else {
          sound.playGateNegative();
          this.shakeIntensity = 0.18;
          this.particles.spawnBurst(screenPos.x, screenPos.y, 20, ['#ff3366', '#ff9900']);
          if (screenPos.visible) {
            this.particles.spawnFloatingText(screenPos.x, screenPos.y - 20, `${diff}`, '#ff3344');
          }
        }

        if (this.crowdCount <= 0) {
          this._triggerGameOver();
          break;
        }
      }
    }
  }

  // --- 4종 장애물 판정 (피격 시 감소 인원 팝업) ---
  _checkObstacleCollisions(dt) {
    const crowdRadius = this.crowdManager.getCrowdRadius(this.crowdCount);

    for (const obs of this.obstacles) {
      const d = obs.userData;
      const zDist = Math.abs(this.playerZ - obs.position.z);

      if (zDist < (d.depth * 0.5 + 0.6)) {
        const xDist = Math.abs((-this.playerX) - obs.position.x);

        if (xDist < (d.width * 0.5 + crowdRadius) && d.hitCooldown <= 0) {
          d.hitCooldown = 0.45;
          sound.playObstacleHit();
          this.shakeIntensity = 0.4;

          // 피해 인원 차감
          const loss = Math.min(this.crowdCount, 2 + Math.floor(Math.random() * 3));
          this.crowdCount = Math.max(0, this.crowdCount - loss);

          // [핵심 요구사항 1 해결] 피격으로 줄어든 인원수(-N) 화면 팝업!
          const screenPos = this._toScreenPos(-this.playerX, 2.2, this.playerZ);
          this.particles.spawnBurst(screenPos.x, screenPos.y, 20, ['#ff2244', '#ffffff', '#ff9900']);
          if (screenPos.visible) {
            this.particles.spawnFloatingText(screenPos.x, screenPos.y - 25, `-${loss}`, '#ff2244');
          }

          if (this.crowdCount <= 0) {
            this._triggerGameOver();
            break;
          }
        }
      }
    }
  }

  // --- [요구사항 4] 입체 무지개 계단 연속 도약 & 인원 차감 후 정상 진입 ---
  _updateStairPhase(dt) {
    this.stairTimer += dt;
    const stepInterval = 0.55;

    // 중앙 정렬 보간
    this.playerX += (0 - this.playerX) * Math.min(1, dt * 10);

    const stairCount = this.stairs.length;
    if (this.stairIndex <= stairCount) {
      const isFinalSummitHop = this.stairIndex === stairCount;
      const prevZ = this.stairIndex === 0 ? this.trackLength : this.stairs[this.stairIndex - 1].z;
      const prevY = this.stairIndex === 0 ? 0 : this.stairs[this.stairIndex - 1].y;

      const targetZ = isFinalSummitHop ? (this.goalPlatformZ + 1.8) : this.stairs[this.stairIndex].z;
      const targetY = isFinalSummitHop ? this.goalPlatformY : this.stairs[this.stairIndex].y;

      const progress = Math.min(1, this.stairTimer / stepInterval);

      // 계단을 폴짝 뛰어오르는 포물선 점프 궤적!
      const currentZ = prevZ + (targetZ - prevZ) * progress;
      const hop = Math.sin(progress * Math.PI) * 0.95;
      const currentY = (prevY + (targetY - prevY) * progress) + hop;

      this.playerZ = currentZ;
      this.crowdManager.crowdGroup.position.y = currentY;

      // 카메라가 뒤에서 뛰어오르는 캐릭터를 함께 비춤
      this.camera.position.set(0, currentY + 5.5, currentZ - 8.5);
      this.cameraTarget.set(0, currentY + 1.5, currentZ + 5.0);
      this.camera.lookAt(this.cameraTarget);

      this.crowdManager.updateCrowd(this.crowdCount, 0, currentZ, this.runTimer * 1.8, 'running');

      if (this.stairTimer >= stepInterval) {
        this.stairTimer = 0;

        if (isFinalSummitHop) {
          // 7계단 정복 후 정상 골 플랫폼으로 완벽 착지!
          this.playerZ = this.goalPlatformZ + 1.8;
          this.state = GameState.CINEMATIC_CHEST;
          this.cinematicTimer = 0;
          this.cinematicStage = 0;
          return;
        }

        const cost = this.config.stairCostPerStep;
        const targetStair = this.stairs[this.stairIndex];

        if (this.crowdCount > cost) {
          this.crowdCount -= cost;
          targetStair.cleared = true;
          // 무지개 계단 밝게 점등
          targetStair.mat.emissiveIntensity = 0.9;
          targetStair.mat.color.set(0xffffff);

          sound.playStairStep(1.0 + this.stairIndex * 0.12);
          this.shakeIntensity = 0.15;

          const screenPos = this._toScreenPos(0, targetY + 1.8, targetZ);
          if (screenPos.visible) {
            this.particles.spawnFloatingText(screenPos.x, screenPos.y - 20, `-${cost}`, '#ffe600');
            this.particles.spawnBurst(screenPos.x, screenPos.y, 14, ['#ffe600', '#ffffff', '#ff9900']);
          }

          // HUD 즉시 갱신 (하단 대형 카운터에 실시간 반영)
          this.onHudUpdate({
            count: this.crowdCount,
            progress: 100,
            stage: this.stage,
            targetGoal: this.config.targetCrowdGoal
          });

          this.stairIndex++;
        } else {
          // 인원 부족 -> 현재 계단에서 멈추고 부분 성공
          this.state = GameState.VICTORY;
          this._finalizeRun(false);
          return;
        }
      }
    }
  }

  // --- [요구사항 5, 6] 생존자 전원 보물상자 워킹 & 정면 보고 점프 환호 + 왕관 & 폭죽 피날레 ---
  _updateCinematicChest(dt) {
    this.cinematicTimer += dt;
    const finalY = this.goalPlatformY;
    this.crowdManager.crowdGroup.position.y = finalY;

    // 가로 시점(Side-View) 좌표
    const targetCamX = -17.0;
    const targetCamY = finalY + 4.5;
    const targetCamZ = this.goalPlatformZ + 9.5;
    const targetLookAtZ = this.goalPlatformZ + 9.5;

    // 1단계: 카메라가 부드럽게 가로 시점으로 회전 전환 (0.9초)
    if (this.cinematicStage === 0) {
      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, dt * 5.0);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, dt * 5.0);
      this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, dt * 5.0);

      this.cameraTarget.set(0, finalY + 1.2, targetLookAtZ);
      this.camera.lookAt(this.cameraTarget);

      // 계단 정상 도착지에서 생존자 전원이 대기
      this.crowdManager.updateCrowd(this.crowdCount, 0, this.playerZ, this.runTimer * 1.2, 'running');

      if (this.cinematicTimer >= 0.9) {
        this.cinematicStage = 1;
        this.cinematicTimer = 0;
      }
    }

    // 2단계: [요구사항 5] 마지막 층에 도달한 살아남은 사람 수만큼 전원이 보물상자까지 당당하게 행진!
    else if (this.cinematicStage === 1) {
      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      this.cameraTarget.set(0, finalY + 1.2, targetLookAtZ);
      this.camera.lookAt(this.cameraTarget);

      // 걸어가는 속도
      const walkSpeed = 4.8;
      this.playerZ += walkSpeed * dt;

      // 생존한 티니핑 전원이 보물상자를 향해 아장아장 행진!
      this.crowdManager.updateCrowd(this.crowdCount, 0, this.playerZ, this.runTimer * 2.2, 'running');

      // 보물상자 바로 앞 도착!
      if (this.playerZ >= this.chestZ - 2.8) {
        this.playerZ = this.chestZ - 2.8;
        this.cinematicStage = 2;
        this.cinematicTimer = 0;

        // 보물상자 개봉 사운드 & 빛
        sound.playVictoryFanfare();
        if (this.chestLight) {
          this.chestLight.intensity = 6.0;
        }
        this._spawn3DCoinsBurst(0, finalY + 1.2, this.chestZ);
        this.shakeIntensity = 0.25;
      }
    }

    // 3단계: [요구사항 6] 상자가 열리고 폭죽이 터지기 전에, 올라간 사람들이 정면을 보고 즐거워하며 점프 환호!
    else if (this.cinematicStage === 2) {
      // 카메라가 정면+측면이 한눈에 보이는 축제 앵글로 부드럽게 이동
      const frontCamX = -9.5;
      const frontCamY = finalY + 3.4;
      const frontCamZ = this.chestZ + 6.0;

      this.camera.position.x += (frontCamX - this.camera.position.x) * Math.min(1, dt * 4.0);
      this.camera.position.y += (frontCamY - this.camera.position.y) * Math.min(1, dt * 4.0);
      this.camera.position.z += (frontCamZ - this.camera.position.z) * Math.min(1, dt * 4.0);

      this.cameraTarget.set(0, finalY + 1.2, this.chestZ - 0.6);
      this.camera.lookAt(this.cameraTarget);

      // [핵심 요구사항 6 반영] 생존자 전원이 정면(카메라 방향)을 향해 턴!
      this.crowdManager.crowdGroup.rotation.y += (-Math.PI * 0.62 - this.crowdManager.crowdGroup.rotation.y) * Math.min(1, dt * 6.0);

      // 정면을 바라보며 양손을 번쩍 들고 날개를 퍼덕이며 신나게 제자리 점프 환호!
      this.crowdManager.updateCrowd(this.crowdCount, 0, this.playerZ, this.runTimer, 'cheering');

      // 상자 뚜껑 활짝 열림
      if (this.chestLidPivot && this.chestLidPivot.rotation.x > -Math.PI * 0.72) {
        this.chestLidPivot.rotation.x -= dt * 4.2;
      }

      // [왕관 연출 & 폭죽 피날레] 상자 속에서 황금 왕관이 떠올라 선두 티니핑 머리로 날아가 씌워짐
      if (this.floatingCrown) {
        if (this.cinematicTimer < 0.8) {
          // 상자에서 수직으로 떠오름
          this.floatingCrown.visible = true;
          this.floatingCrown.position.y += dt * 2.2;
          this.floatingCrown.rotation.y += dt * 4.5;
        } else if (this.cinematicTimer < 1.7) {
          // 선두 티니핑 머리 위치로 비행
          const progress = (this.cinematicTimer - 0.8) / 0.9;
          const startPos = new THREE.Vector3(0, finalY + 2.5, this.chestZ);
          const targetPos = new THREE.Vector3(0, finalY + 1.38, this.playerZ);
          this.floatingCrown.position.lerpVectors(startPos, targetPos, progress);
          this.floatingCrown.rotation.y += dt * 6.0;
        } else {
          // 머리에 왕관 착용 완료 & 대규모 폭죽 + 컨페티 대분출!
          if (this.floatingCrown.visible) {
            this.floatingCrown.visible = false;

            // 선두 티니핑의 머리에 왕관 장착 활성화
            if (this.crowdManager.pool.length > 0) {
              const lead = this.crowdManager.pool[0];
              if (lead.userData.crownMesh) {
                lead.userData.crownMesh.visible = true;
              }
            }

            // 왕관 착용 마법 차임 사운드
            sound.playCrownSparkle();

            // 밤하늘을 수놓는 초대형 폭죽 & 꽃가루 대분출!
            this.particles.spawnFireworks(this.width * 0.5, this.height * 0.28, 85);
            this.particles.spawnFireworks(this.width * 0.25, this.height * 0.38, 65);
            this.particles.spawnFireworks(this.width * 0.75, this.height * 0.38, 65);
            this.particles.spawnConfetti(this.width * 0.5, this.height * 0.42, 120);
            this.particles.spawnFloatingText(this.width * 0.5, this.height * 0.24, '👑 로열 티니핑 등극! 👑', '#ffd700');
            this.shakeIntensity = 0.35;
          }
        }
      }

      if (this.cinematicTimer >= 4.2) {
        this.state = GameState.VICTORY;
        this._finalizeRun(true);
      }
    }
  }

  _finalizeRun(reachedTop) {
    const finalCount = this.crowdCount;
    const reachedSteps = this.stairIndex;
    const maxSteps = this.stairs.length;
    const lastStair = reachedSteps > 0 ? this.stairs[reachedSteps - 1] : null;
    const multiplier = lastStair ? lastStair.multiplier : 1.0;

    const score = Math.floor(finalCount * multiplier);
    const goldEarned = Math.floor(100 + score * 3);
    const gemsEarned = reachedTop ? 5 + Math.floor(finalCount / 10) : Math.max(1, Math.floor(reachedSteps / 2));

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
    }, 1000);
  }

  _triggerGameOver() {
    this.state = GameState.GAME_OVER;
    sound.playGateNegative();
    this.crowdManager.updateCrowd(1, this.playerX, this.playerZ, this.runTimer, 'fallen');

    setTimeout(() => {
      this.onGameEnd({
        success: false,
        reachedTop: false,
        finalCount: 0,
        reachedSteps: 0,
        maxSteps: this.stairs.length,
        multiplier: 1.0,
        score: 0,
        goldEarned: 10,
        gemsEarned: 0,
        stage: this.stage
      });
    }, 1200);
  }

  /**
   * 보물상자 열림 3D 코인 분출
   */
  _spawn3DCoinsBurst(x, y, z) {
    const THREE = this.THREE;
    const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffb700,
      emissiveIntensity: 0.25
    });

    for (let i = 0; i < 30; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(
        x + (Math.random() - 0.5) * 1.0,
        y + 0.3,
        z + (Math.random() - 0.5) * 0.8
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      coin.userData = {
        vx: Math.cos(angle) * speed,
        vy: 4.8 + Math.random() * 3.2,
        vz: Math.sin(angle) * speed,
        rotSpeedX: (Math.random() - 0.5) * 16,
        rotSpeedY: (Math.random() - 0.5) * 16,
        groundY: y,
        life: 2.5
      };
      this.scene.add(coin);
      this.coins3D.push(coin);
    }
  }

  _update3DCoins(dt) {
    for (let i = this.coins3D.length - 1; i >= 0; i--) {
      const c = this.coins3D[i];
      const d = c.userData;
      c.position.x += d.vx * dt;
      c.position.y += d.vy * dt;
      c.position.z += d.vz * dt;
      d.vy -= 9.8 * dt; // 중력

      c.rotation.x += d.rotSpeedX * dt;
      c.rotation.y += d.rotSpeedY * dt;

      if (c.position.y <= d.groundY) {
        c.position.y = d.groundY;
        d.vy = -d.vy * 0.4;
        d.vx *= 0.7;
        d.vz *= 0.7;
      }

      d.life -= dt;
      if (d.life <= 0) {
        this.scene.remove(c);
        this.coins3D.splice(i, 1);
      }
    }
  }

  // --- 렌더링 ---
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

