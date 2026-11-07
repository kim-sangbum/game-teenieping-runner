/**
 * UIManager.js
 * 메인 로비, 상점 모달, 인게임 HUD, 결과 화면 UI 컨트롤러
 */

import { ShopCatalog, CustomizationCategory } from '../database/CustomizationSchema.js';
import { DifficultyManager } from '../engine/DifficultyManager.js';
import { sound } from '../engine/SoundFx.js';

export class UIManager {
  constructor(userDb, onStartGame, onRestartGame, onNextStage) {
    this.userDb = userDb;
    this.onStartGame = onStartGame;
    this.onRestartGame = onRestartGame;
    this.onNextStage = onNextStage;

    this.activeCategory = CustomizationCategory.SKIN_TONE;

    this._cacheDOMElements();
    this._bindEvents();
    this.refreshAll();
  }

  _cacheDOMElements() {
    // 스크린 컨테이너
    this.screenLobby = document.getElementById('screen-lobby');
    this.screenGame = document.getElementById('screen-game');
    this.modalResult = document.getElementById('modal-result');
    this.modalPause = document.getElementById('modal-pause');
    this.modalShop = document.getElementById('modal-shop');
    this.modalUserSelect = document.getElementById('modal-user-select');

    // 로비 요소
    this.userNameDisplay = document.getElementById('lobby-user-name');
    this.userAgeDisplay = document.getElementById('lobby-user-age');
    this.userTierBadge = document.getElementById('lobby-tier-badge');
    this.userTierDesc = document.getElementById('lobby-tier-desc');
    this.goldDisplay = document.getElementById('currency-gold');
    this.gemDisplay = document.getElementById('currency-gem');
    this.highScoreDisplay = document.getElementById('lobby-high-score');
    this.currentStageDisplay = document.getElementById('lobby-stage-badge');

    // 인게임 HUD 요소
    this.hudStage = document.getElementById('hud-stage');
    this.hudCrowdCount = document.getElementById('hud-crowd-count');
    this.hudProgressBar = document.getElementById('hud-progress-fill');
    this.hudGoalTarget = document.getElementById('hud-goal-target');

    // 결과 모달 요소
    this.resultTitle = document.getElementById('result-title');
    this.resultSubtitle = document.getElementById('result-subtitle');
    this.resultScore = document.getElementById('result-score');
    this.resultStairs = document.getElementById('result-stairs');
    this.resultGold = document.getElementById('result-gold');
    this.resultGems = document.getElementById('result-gems');
    this.btnNextStage = document.getElementById('btn-next-stage');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnLobbyFromGame = document.getElementById('btn-lobby');

    // 상점 요소
    this.shopCategoryTabs = document.getElementById('shop-category-tabs');
    this.shopItemsGrid = document.getElementById('shop-items-grid');
    this.shopGoldDisplay = document.getElementById('shop-gold');
    this.shopGemDisplay = document.getElementById('shop-gem');

    // 유저 관리 입력창
    this.inputNewUserName = document.getElementById('input-new-user-name');
    this.inputNewUserAge = document.getElementById('input-new-user-age');
    this.userListContainer = document.getElementById('user-list-container');
  }

  _bindEvents() {
    // 사운드 음소거 토글
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const enabled = sound.toggleSound();
        btnSound.textContent = enabled ? '🔊' : '🔇';
        if (enabled) sound.playClick();
      });
    }

    // 퀵 연령대 빠른 전환 버튼들
    document.querySelectorAll('.btn-quick-age').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const user = this.userDb.getActiveUser();
        if (!user) return;
        const targetAge = parseInt(btn.dataset.age, 10);
        this.userDb.updateAge(user.id, targetAge);
        this.refreshAll();
      });
    });

    // 일시정지 버튼들
    const btnPause = document.getElementById('btn-pause-game');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        sound.playClick();
        this.openPauseModal();
      });
    }

    const btnResume = document.getElementById('btn-resume-game');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        sound.playClick();
        this.closePauseModal();
      });
    }

    const btnPauseRetry = document.getElementById('btn-pause-retry');
    if (btnPauseRetry) {
      btnPauseRetry.addEventListener('click', () => {
        sound.playClick();
        this.closePauseModal();
        const user = this.userDb.getActiveUser();
        this.onRestartGame(user);
      });
    }

    const btnPauseLobby = document.getElementById('btn-pause-lobby');
    if (btnPauseLobby) {
      btnPauseLobby.addEventListener('click', () => {
        sound.playClick();
        this.closePauseModal();
        this.showLobbyScreen();
      });
    }

    // ESC 키 일시정지 토글
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!this.screenGame.classList.contains('hidden')) {
          if (this.modalPause.classList.contains('hidden')) {
            this.openPauseModal();
          } else {
            this.closePauseModal();
          }
        }
      }
    });

    // 게임 시작 버튼
    document.getElementById('btn-play').addEventListener('click', () => {
      sound.playClick();
      const user = this.userDb.getActiveUser();
      if (!user) {
        this.openUserSelectModal();
        return;
      }
      this.showGameScreen();
      this.onStartGame(user, user.currentStage || 1);
    });

    // 유저 변경 버튼
    document.getElementById('btn-change-user').addEventListener('click', () => {
      sound.playClick();
      this.openUserSelectModal();
    });

    // 나이 변경 버튼
    document.getElementById('btn-edit-age').addEventListener('click', () => {
      sound.playClick();
      const user = this.userDb.getActiveUser();
      if (!user) return;
      const newAgeStr = prompt(`새로운 연령(만 나이)을 입력해 주세요:\n(현재: ${user.age}세)`, user.age);
      if (newAgeStr !== null) {
        const newAge = parseInt(newAgeStr, 10);
        if (!isNaN(newAge) && newAge >= 3 && newAge <= 100) {
          this.userDb.updateAge(user.id, newAge);
          this.refreshAll();
          alert(`연령이 ${newAge}세로 변경되었습니다. 난이도가 동적으로 조정됩니다.`);
        } else {
          alert('올바른 연령(3~100)을 입력해 주세요.');
        }
      }
    });

    // 상점 열기 버튼
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      sound.playClick();
      this.openShopModal();
    });

    // 상점 닫기 버튼
    document.getElementById('btn-close-shop').addEventListener('click', () => {
      sound.playClick();
      this.modalShop.classList.add('hidden');
      this.refreshLobby();
    });

    // 결과 화면 버튼들
    this.btnNextStage.addEventListener('click', () => {
      sound.playClick();
      this.modalResult.classList.add('hidden');
      const user = this.userDb.getActiveUser();
      this.onNextStage(user);
    });

    this.btnRetry.addEventListener('click', () => {
      sound.playClick();
      this.modalResult.classList.add('hidden');
      const user = this.userDb.getActiveUser();
      this.onRestartGame(user);
    });

    this.btnLobbyFromGame.addEventListener('click', () => {
      sound.playClick();
      this.modalResult.classList.add('hidden');
      this.showLobbyScreen();
    });

    // 새 유저 생성 버튼
    document.getElementById('btn-create-user').addEventListener('click', () => {
      sound.playClick();
      const name = this.inputNewUserName.value;
      const age = this.inputNewUserAge.value;
      try {
        this.userDb.createUser(name, age);
        this.inputNewUserName.value = '';
        this.closeUserSelectModal();
        this.refreshAll();
      } catch (err) {
        alert(err.message);
      }
    });

    // 유저 선택 모달 닫기
    document.getElementById('btn-close-user-modal').addEventListener('click', () => {
      sound.playClick();
      if (!this.userDb.getActiveUser()) {
        alert('게임을 진행하려면 유저를 생성하거나 선택해야 합니다.');
        return;
      }
      this.closeUserSelectModal();
    });
  }

  openPauseModal() {
    this.modalPause.classList.remove('hidden');
    sound.stopBgm();
    if (this.onPauseToggle) this.onPauseToggle(true);
  }

  closePauseModal() {
    this.modalPause.classList.add('hidden');
    sound.startBgm();
    if (this.onPauseToggle) this.onPauseToggle(false);
  }

  // --- 화면 전환 ---
  showLobbyScreen() {
    sound.stopBgm();
    this.screenLobby.classList.remove('hidden');
    this.screenGame.classList.add('hidden');
    this.modalResult.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.refreshAll();
  }

  showGameScreen() {
    this.screenLobby.classList.add('hidden');
    this.screenGame.classList.remove('hidden');
    this.modalResult.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    sound.startBgm();
  }

  // --- 전체 UI 새로고침 ---
  refreshAll() {
    this.refreshLobby();
  }

  refreshLobby() {
    const user = this.userDb.getActiveUser();
    if (!user) {
      this.openUserSelectModal();
      return;
    }

    this.userNameDisplay.textContent = user.name;
    this.userAgeDisplay.textContent = `${user.age}세`;
    this.goldDisplay.textContent = (user.gold || 0).toLocaleString();
    this.gemDisplay.textContent = (user.gems || 0).toLocaleString();
    this.highScoreDisplay.textContent = (user.highScore || 0).toLocaleString();
    this.currentStageDisplay.textContent = `Stage ${user.currentStage || 1}`;

    // 연령별 DDA 티어 뱃지 표시
    const config = DifficultyManager.getConfig(user.age, user.currentStage || 1);
    this.userTierBadge.textContent = config.tierName;
    this.userTierDesc.textContent = config.description;

    // 7세 이하 전용 강조 스타일링
    if (config.tier === 'toddler') {
      this.userTierBadge.className = 'tier-badge toddler';
    } else if (config.tier === 'junior') {
      this.userTierBadge.className = 'tier-badge junior';
    } else {
      this.userTierBadge.className = 'tier-badge default';
    }

    // 퀵 연령 버튼 active 표시 동기화
    document.querySelectorAll('.btn-quick-age').forEach(btn => {
      const btnAge = parseInt(btn.dataset.age, 10);
      const isCurrentTier = DifficultyManager.getAgeTier(btnAge) === config.tier;
      btn.classList.toggle('active', isCurrentTier);
    });
  }

  // --- 유저 선택 / 생성 모달 ---
  openUserSelectModal() {
    this.modalUserSelect.classList.remove('hidden');
    this._renderUserList();
  }

  closeUserSelectModal() {
    this.modalUserSelect.classList.add('hidden');
  }

  _renderUserList() {
    const users = this.userDb.getAllUsers();
    const activeUser = this.userDb.getActiveUser();
    this.userListContainer.innerHTML = '';

    if (users.length === 0) {
      this.userListContainer.innerHTML = '<p class="empty-tip">등록된 유저가 없습니다. 아래에서 새 유저를 등록해 주세요!</p>';
      return;
    }

    users.forEach(u => {
      const card = document.createElement('div');
      card.className = `user-card ${activeUser && activeUser.id === u.id ? 'active' : ''}`;
      card.innerHTML = `
        <div class="user-card-info">
          <div class="user-card-name">${escapeHtml(u.name)} <span class="user-card-age">${u.age}세</span></div>
          <div class="user-card-sub">Stage ${u.currentStage || 1} · 🪙 ${(u.gold || 0).toLocaleString()} · 💎 ${u.gems || 0}</div>
        </div>
        <button class="btn-select-user">${activeUser && activeUser.id === u.id ? '선택됨' : '선택'}</button>
      `;

      card.querySelector('.btn-select-user').addEventListener('click', () => {
        sound.playClick();
        this.userDb.login(u.id);
        this.closeUserSelectModal();
        this.refreshAll();
      });

      this.userListContainer.appendChild(card);
    });
  }

  // --- 상점 & 커스터마이징 모달 ---
  openShopModal() {
    const user = this.userDb.getActiveUser();
    if (!user) return;

    this.modalShop.classList.remove('hidden');
    this.shopGoldDisplay.textContent = (user.gold || 0).toLocaleString();
    this.shopGemDisplay.textContent = (user.gems || 0).toLocaleString();

    this._renderShopCategoryTabs();
    this._renderShopItems();
  }

  _renderShopCategoryTabs() {
    const categories = [
      { id: CustomizationCategory.SKIN_TONE, label: '피부색' },
      { id: CustomizationCategory.HAIR_STYLE, label: '헤어' },
      { id: CustomizationCategory.OUTFIT, label: '의상' },
      { id: CustomizationCategory.ACCESSORY, label: '소품' },
      { id: CustomizationCategory.GENDER, label: '체형/성별' },
      { id: CustomizationCategory.AURA, label: '오라' }
    ];

    this.shopCategoryTabs.innerHTML = '';
    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `shop-tab ${this.activeCategory === cat.id ? 'active' : ''}`;
      tab.textContent = cat.label;
      tab.addEventListener('click', () => {
        sound.playClick();
        this.activeCategory = cat.id;
        this._renderShopCategoryTabs();
        this._renderShopItems();
      });
      this.shopCategoryTabs.appendChild(tab);
    });
  }

  _renderShopItems() {
    const user = this.userDb.getActiveUser();
    if (!user) return;

    const items = ShopCatalog.filter(it => it.category === this.activeCategory);
    this.shopItemsGrid.innerHTML = '';

    const currentEquippedId = user.customization ? user.customization[this.activeCategory] : null;
    const inventory = user.inventory || [];

    items.forEach(item => {
      const isOwned = inventory.includes(item.id);
      const isEquipped = currentEquippedId === item.id;

      const itemCard = document.createElement('div');
      itemCard.className = `shop-item-card ${isEquipped ? 'equipped' : ''} ${isOwned ? 'owned' : ''}`;

      // 아이콘 / 컬러칩 프리뷰
      let previewHtml = '';
      if (item.category === CustomizationCategory.SKIN_TONE && item.color) {
        previewHtml = `<div class="color-chip" style="background-color: ${item.color};"></div>`;
      } else {
        previewHtml = `<div class="item-icon-box">${item.icon || '✨'}</div>`;
      }

      let btnHtml = '';
      if (isEquipped) {
        btnHtml = `<button class="btn-item-action equipped" disabled>장착 중</button>`;
      } else if (isOwned) {
        btnHtml = `<button class="btn-item-action equip">장착하기</button>`;
      } else {
        const priceIcon = item.priceType === 'gem' ? '💎' : '🪙';
        btnHtml = `<button class="btn-item-action buy">${priceIcon} ${item.price.toLocaleString()}</button>`;
      }

      itemCard.innerHTML = `
        <div class="item-preview">${previewHtml}</div>
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-desc">${escapeHtml(item.description)}</div>
        <div class="item-action-area">${btnHtml}</div>
      `;

      const btn = itemCard.querySelector('.btn-item-action');
      if (btn && !isEquipped) {
        btn.addEventListener('click', () => {
          sound.playClick();
          try {
            if (isOwned) {
              this.userDb.equipItem(user.id, item.id);
            } else {
              this.userDb.purchaseItem(user.id, item.id);
              this.userDb.equipItem(user.id, item.id);
            }
            this.openShopModal(); // 상점 UI 즉시 갱신
            this.refreshLobby();
          } catch (err) {
            alert(err.message);
          }
        });
      }

      this.shopItemsGrid.appendChild(itemCard);
    });
  }

  // --- 인게임 HUD 갱신 ---
  updateHud({ count, progress, stage, targetGoal }) {
    this.hudCrowdCount.textContent = count.toLocaleString();
    this.hudStage.textContent = `STAGE ${stage}`;
    this.hudProgressBar.style.width = `${progress}%`;
    this.hudGoalTarget.textContent = `목표: ${targetGoal}명`;
  }

  // --- 결과 화면 모달 ---
  showResultModal(result) {
    sound.stopBgm();
    const user = this.userDb.getActiveUser();
    if (user) {
      // DB 기록 반영
      this.userDb.recordRunResult(user.id, {
        score: result.score,
        goldEarned: result.goldEarned,
        gemsEarned: result.gemsEarned,
        stageCleared: result.reachedTop ? result.stage : null
      });
      this.refreshLobby();
    }

    if (result.reachedTop) {
      this.resultTitle.textContent = '🎉 스테이지 완전 정복!';
      this.resultTitle.className = 'result-title success';
      this.resultSubtitle.textContent = `목적지 보상 계단 꼭대기에서 보물상자를 획득했습니다! (×${result.multiplier.toFixed(1)})`;
      this.btnNextStage.classList.remove('hidden');
    } else if (result.success) {
      this.resultTitle.textContent = '👏 계단 도달 완료!';
      this.resultTitle.className = 'result-title partial';
      this.resultSubtitle.textContent = `계단 ${result.reachedSteps}칸까지 도달했습니다. (×${result.multiplier.toFixed(1)})`;
      this.btnNextStage.classList.add('hidden');
    } else {
      this.resultTitle.textContent = '💥 게임 오버';
      this.resultTitle.className = 'result-title fail';
      this.resultSubtitle.textContent = '군단이 모두 소진되었습니다. 다시 도전해 보세요!';
      this.btnNextStage.classList.add('hidden');
    }

    this.resultScore.textContent = result.score.toLocaleString();
    this.resultStairs.textContent = `${result.reachedSteps} / ${result.maxSteps} 칸`;
    this.resultGold.textContent = `+${result.goldEarned.toLocaleString()}`;
    this.resultGems.textContent = `+${result.gemsEarned.toLocaleString()}`;

    this.modalResult.classList.remove('hidden');
  }
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

