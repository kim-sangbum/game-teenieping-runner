/**
 * main.js
 * 게임 진입점 및 애플리케이션 라이프사이클 관리
 */

import { UserDatabase } from './database/UserDatabase.js';
import { GameEngine3D } from './engine/GameEngine3D.js';
import { UIManager } from './ui/UIManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-canvas-container');
  const particleCanvas = document.getElementById('particle-canvas');
  const particleCtx = particleCanvas.getContext('2d');
  const userDb = new UserDatabase();

  let engine = null;
  let uiManager = null;
  let currentPlayingStage = 1;

  // 캔버스 크기 조정 (모바일 친화적 세로 비율 유지)
  function resizeCanvas() {
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 700;
    if (width > 0 && height > 0) {
      particleCanvas.width = width;
      particleCanvas.height = height;
      if (engine) {
        engine.resize(width, height);
      }
    }
  }

  // 게임 종료 핸들러 (엔진에서 호출)
  function handleGameEnd(result) {
    uiManager.showResultModal(result);
  }

  // HUD 갱신 핸들러 (엔진에서 호출)
  function handleHudUpdate(hudData) {
    uiManager.updateHud(hudData);
  }

  // 게임 시작
  function startGame(user, stage) {
    currentPlayingStage = stage || 1;
    resizeCanvas();
    engine.startLevel(user, currentPlayingStage);
  }

  // 재시작
  function restartGame(user) {
    startGame(user, currentPlayingStage);
  }

  // 다음 스테이지
  function nextStage(user) {
    currentPlayingStage++;
    startGame(user, currentPlayingStage);
  }

  // 3D 엔진 & UI 초기화
  engine = new GameEngine3D(container, handleGameEnd, handleHudUpdate);
  uiManager = new UIManager(userDb, startGame, restartGame, nextStage);
  uiManager.onPauseToggle = (isPaused) => {
    if (engine) engine.isPaused = isPaused;
  };

  // 기본 유저가 없으면 데모 유저 자동 등록 안내 또는 생성 모달 표시
  if (!userDb.getActiveUser()) {
    // 최초 접속 시 기본 환영 유저 하나를 자동 생성하거나 선택창 띄우기
    const users = userDb.getAllUsers();
    if (users.length === 0) {
      // 7세 기본 유저를 생성하여 키즈 모드 바로 체감 가능하도록 준비
      userDb.createUser('러너_키즈', 7);
      uiManager.refreshAll();
    } else {
      userDb.login(users[0].id);
      uiManager.refreshAll();
    }
  }

  // 리사이즈 리스너
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 메인 애니메이션 루프
  let lastTimestamp = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTimestamp) / 1000, 0.1); // 최대 0.1초 dt 캡핑
    lastTimestamp = now;

    try {
      engine.update(dt);
      engine.render();

      // 2D 파티클 & 부유 텍스트 오버레이 렌더링
      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      engine.particles.render(particleCtx);
    } catch (err) {
      console.error('Game loop error:', err);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});

