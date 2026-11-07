/**
 * UserDatabase.js
 * 유저 계정, 연령, 재화(골드/보물), 인벤토리 및 커스터마이징 데이터 관리
 */

import {
  createDefaultCustomization,
  createDefaultInventory,
  getItemById
} from './CustomizationSchema.js';

const STORAGE_KEY_USERS = 'hyper_run_users_v1';
const STORAGE_KEY_ACTIVE_USER = 'hyper_run_active_user_id_v1';

export class UserDatabase {
  constructor() {
    this.users = this._loadUsers();
    this.activeUserId = this._loadActiveUserId();
  }

  // --- 내부 LocalStorage 연동 ---
  _loadUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to load users from localStorage:', e);
      return {};
    }
  }

  _saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    } catch (e) {
      console.warn('Failed to save users to localStorage:', e);
    }
  }

  _loadActiveUserId() {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || null;
  }

  _saveActiveUserId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    }
    this.activeUserId = id;
  }

  // --- 유저 관리 메서드 ---

  /**
   * 등록된 모든 유저 목록 조회
   */
  getAllUsers() {
    return Object.values(this.users);
  }

  /**
   * 현재 활성 유저 객체 조회
   */
  getActiveUser() {
    if (!this.activeUserId || !this.users[this.activeUserId]) {
      return null;
    }
    return this.users[this.activeUserId];
  }

  /**
   * 새 유저 생성 및 로그인
   * @param {string} username - 유저 닉네임 / 아이디
   * @param {number} age - 유저 나이 (필수)
   */
  createUser(username, age) {
    const trimmed = (username || '').trim();
    if (!trimmed) {
      throw new Error('유저 닉네임을 입력해 주세요.');
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 3 || parsedAge > 100) {
      throw new Error('올바른 연령(3세~100세)을 입력해 주세요.');
    }

    const userId = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newUser = {
      id: userId,
      name: trimmed,
      age: parsedAge,
      gold: 500, // 초기 축하 지원금
      gems: 10,  // 초기 보물 지원금
      highScore: 0,
      currentStage: 1,
      totalRuns: 0,
      customization: createDefaultCustomization(),
      inventory: createDefaultInventory(),
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };

    this.users[userId] = newUser;
    this._saveUsers();
    this.login(userId);
    return newUser;
  }

  /**
   * 기존 유저로 로그인
   */
  login(userId) {
    if (!this.users[userId]) {
      throw new Error('존재하지 않는 유저입니다.');
    }
    this.users[userId].lastLoginAt = Date.now();
    this._saveActiveUserId(userId);
    this._saveUsers();
    return this.users[userId];
  }

  /**
   * 유저 연령 업데이트 (동적 난이도 즉시 반영용)
   */
  updateAge(userId, newAge) {
    const user = this.users[userId];
    if (!user) return null;
    const parsed = parseInt(newAge, 10);
    if (!isNaN(parsed) && parsed >= 3) {
      user.age = parsed;
      this._saveUsers();
    }
    return user;
  }

  // --- 재화 관리 ---

  /**
   * 골드/보물 지급
   */
  addCurrency(userId, gold = 0, gems = 0) {
    const user = this.users[userId];
    if (!user) return false;
    user.gold = Math.max(0, (user.gold || 0) + gold);
    user.gems = Math.max(0, (user.gems || 0) + gems);
    this._saveUsers();
    return true;
  }

  /**
   * 골드/보물 차감
   */
  deductCurrency(userId, gold = 0, gems = 0) {
    const user = this.users[userId];
    if (!user) return false;
    if ((user.gold || 0) < gold || (user.gems || 0) < gems) {
      return false; // 잔액 부족
    }
    user.gold -= gold;
    user.gems -= gems;
    this._saveUsers();
    return true;
  }

  // --- 게임 결과 기록 ---

  /**
   * 라운드 완료 후 점수 및 재화 반영
   */
  recordRunResult(userId, { score, goldEarned, gemsEarned, stageCleared }) {
    const user = this.users[userId];
    if (!user) return null;

    user.totalRuns = (user.totalRuns || 0) + 1;
    if (score > (user.highScore || 0)) {
      user.highScore = score;
    }
    user.gold = (user.gold || 0) + goldEarned;
    user.gems = (user.gems || 0) + gemsEarned;

    if (stageCleared && user.currentStage <= stageCleared) {
      user.currentStage = stageCleared + 1;
    }

    this._saveUsers();
    return user;
  }

  // --- 상점 및 커스터마이징 로직 ---

  /**
   * 아이템 구매(해금)
   */
  purchaseItem(userId, itemId) {
    const user = this.users[userId];
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    const item = getItemById(itemId);
    if (!item) throw new Error('존재하지 않는 아이템입니다.');

    if (user.inventory.includes(itemId)) {
      throw new Error('이미 보유하고 있는 아이템입니다.');
    }

    // 재화 차감
    if (item.priceType === 'gold') {
      if (!this.deductCurrency(userId, item.price, 0)) {
        throw new Error('골드가 부족합니다.');
      }
    } else if (item.priceType === 'gem') {
      if (!this.deductCurrency(userId, 0, item.price)) {
        throw new Error('보물(젬)이 부족합니다.');
      }
    }

    user.inventory.push(itemId);
    this._saveUsers();
    return { success: true, item };
  }

  /**
   * 아이템 장착
   */
  equipItem(userId, itemId) {
    const user = this.users[userId];
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    const item = getItemById(itemId);
    if (!item) throw new Error('존재하지 않는 아이템입니다.');

    if (!user.inventory.includes(itemId)) {
      throw new Error('보유하지 않은 아이템은 장착할 수 없습니다.');
    }

    if (!user.customization) {
      user.customization = createDefaultCustomization();
    }

    user.customization[item.category] = itemId;
    this._saveUsers();
    return { success: true, customization: user.customization };
  }
}

