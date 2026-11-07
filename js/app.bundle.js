/**
 * app.bundle.js (3D High-Quality Edition)
 * 
 * - Three.js WebGL 3D 엔진 기반 러닝 게임
 * - 3D 트랙, 네온 사칙연산 게이트
 * - 4종 3D 장애물: 망치, 회전 톱니, 가시밭, 싱크홀
 * - 실제 입체 구조 3D 계단 (Staircase)
 * - 최종 계단 도착 시 '가로(사이드뷰) 시점 전환' 및 '왼쪽에서 오른쪽으로 걸어가 보물상자를 여는 극적 연출'
 * - 숫자 폭증 방지 & 뺄셈/나눗셈 적극 도입
 * - 키보드 화살표 키 + 마우스/터치 드래그 완벽 하이브리드 지원
 */

(function () {
  'use strict';

  const THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js library is not detected yet.');
  }

  // ============================================================
  // 1. CustomizationSchema
  // ============================================================
  const CustomizationCategory = {
    GENDER: 'gender',
    SKIN_TONE: 'skinTone',
    HAIR_STYLE: 'hairStyle',
    OUTFIT: 'outfit',
    ACCESSORY: 'accessory',
    AURA: 'aura'
  };

  const ShopCatalog = [
    { id: 'gender_neutral', category: CustomizationCategory.GENDER, name: '기본 중성 체형', description: '기본 3D 스틱맨 체형', priceType: 'gold', price: 0, isDefault: true },
    { id: 'gender_boy', category: CustomizationCategory.GENDER, name: '보이시 스타일', description: '활기찬 체형 스타일', priceType: 'gold', price: 100, isDefault: false },
    { id: 'gender_girl', category: CustomizationCategory.GENDER, name: '소녀 스타일', description: '경쾌한 체형 스타일', priceType: 'gold', price: 100, isDefault: false },

    { id: 'skin_default', category: CustomizationCategory.SKIN_TONE, name: '하츄핑 핑크', description: '하츄핑 시그니처 핑크', priceType: 'gold', price: 0, isDefault: true, color: '#ff9ebb' },
    { id: 'skin_peach', category: CustomizationCategory.SKIN_TONE, name: '조아핑 피치', description: '따뜻한 살구빛 컬러', priceType: 'gold', price: 150, isDefault: false, color: '#ffcba4' },
    { id: 'skin_lemon', category: CustomizationCategory.SKIN_TONE, name: '방글핑 옐로우', description: '빛나는 레몬 컬러', priceType: 'gold', price: 200, isDefault: false, color: '#ffe600' },
    { id: 'skin_rose', category: CustomizationCategory.SKIN_TONE, name: '믿어핑 로즈', description: '화사한 로즈빛 컬러', priceType: 'gold', price: 250, isDefault: false, color: '#ff4b8b' },
    { id: 'skin_obsidian', category: CustomizationCategory.SKIN_TONE, name: '매지컬 퍼플', description: '신비로운 보라빛 컬러', priceType: 'gem', price: 5, isDefault: false, color: '#5c4d7d' },

    { id: 'hair_basic', category: CustomizationCategory.HAIR_STYLE, name: '민머리 (베이직)', description: '미니멀 기본형', priceType: 'gold', price: 0, isDefault: true, icon: '🧑‍🦲' },
    { id: 'hair_spiky', category: CustomizationCategory.HAIR_STYLE, name: '스파이키 숏', description: '날렵한 뾰족머리', priceType: 'gold', price: 300, isDefault: false, icon: '⚡' },
    { id: 'hair_ponytail', category: CustomizationCategory.HAIR_STYLE, name: '하이 포니테일', description: '찰랑이는 포니테일', priceType: 'gold', price: 350, isDefault: false, icon: '👱‍♀️' },
    { id: 'hair_cap', category: CustomizationCategory.HAIR_STYLE, name: '스트릿 스냅백', description: '힙스터 모자', priceType: 'gem', price: 8, isDefault: false, icon: '🧢' },

    { id: 'outfit_runner', category: CustomizationCategory.OUTFIT, name: '베이직 트랙슈트', description: '가벼운 유니폼', priceType: 'gold', price: 0, isDefault: true, icon: '🎽' },
    { id: 'outfit_hoodie', category: CustomizationCategory.OUTFIT, name: '네온 후드티', description: '스타일리시한 후드', priceType: 'gold', price: 400, isDefault: false, icon: '🧥' },
    { id: 'outfit_cape', category: CustomizationCategory.OUTFIT, name: '영웅의 망토', description: '히어로 망토', priceType: 'gem', price: 10, isDefault: false, icon: '🦸' },
    { id: 'outfit_royal', category: CustomizationCategory.OUTFIT, name: '로열 가디언 코트', description: '최고급 골드 코트', priceType: 'gem', price: 20, isDefault: false, icon: '👑' },

    { id: 'acc_none', category: CustomizationCategory.ACCESSORY, name: '장착 안 함', description: '가벼운 몸 상태', priceType: 'gold', price: 0, isDefault: true, icon: '❌' },
    { id: 'acc_glasses', category: CustomizationCategory.ACCESSORY, name: '쿨 선글라스', description: '힙한 안경', priceType: 'gold', price: 250, isDefault: false, icon: '🕶️' },
    { id: 'acc_headphone', category: CustomizationCategory.ACCESSORY, name: '무선 헤드셋', description: '신나는 비트 사운드', priceType: 'gold', price: 350, isDefault: false, icon: '🎧' },
    { id: 'acc_crown', category: CustomizationCategory.ACCESSORY, name: '골드 크라운', description: '챔피언 왕관', priceType: 'gem', price: 15, isDefault: false, icon: '👑' },

    { id: 'aura_none', category: CustomizationCategory.AURA, name: '오라 없음', description: '기본 상태', priceType: 'gold', price: 0, isDefault: true, icon: '⚪' },
    { id: 'aura_spark', category: CustomizationCategory.AURA, name: '번개 스파크', description: '전기 불꽃 효과', priceType: 'gold', price: 500, isDefault: false, icon: '⚡' },
    { id: 'aura_hearts', category: CustomizationCategory.AURA, name: '러브 하트 빔', description: '하트 이펙트', priceType: 'gold', price: 500, isDefault: false, icon: '💖' },
    { id: 'aura_starlight', category: CustomizationCategory.AURA, name: '스타라이트 갤럭시', description: '우주 별빛 효과', priceType: 'gem', price: 25, isDefault: false, icon: '✨' }
  ];

  function createDefaultCustomization() {
    return {
      [CustomizationCategory.GENDER]: 'gender_neutral',
      [CustomizationCategory.SKIN_TONE]: 'skin_default',
      [CustomizationCategory.HAIR_STYLE]: 'hair_basic',
      [CustomizationCategory.OUTFIT]: 'outfit_runner',
      [CustomizationCategory.ACCESSORY]: 'acc_none',
      [CustomizationCategory.AURA]: 'aura_none'
    };
  }

  function createDefaultInventory() {
    return ShopCatalog.filter(i => i.isDefault).map(i => i.id);
  }

  function getItemById(id) {
    return ShopCatalog.find(i => i.id === id) || null;
  }

  // ============================================================
  // 2. UserDatabase
  // ============================================================
  const STORAGE_KEY_USERS = 'hyper_run_users_v1';
  const STORAGE_KEY_ACTIVE_USER = 'hyper_run_active_user_id_v1';

  class UserDatabase {
    constructor() {
      this.users = this._loadUsers();
      this.activeUserId = this._loadActiveUserId();
    }

    _loadUsers() {
      try {
        const data = localStorage.getItem(STORAGE_KEY_USERS);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    }

    _saveUsers() {
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      } catch (e) { }
    }

    _loadActiveUserId() {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || null;
    }

    _saveActiveUserId(id) {
      if (id) localStorage.setItem(STORAGE_KEY_ACTIVE_USER, id);
      else localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
      this.activeUserId = id;
    }

    getAllUsers() {
      return Object.values(this.users);
    }

    getActiveUser() {
      if (!this.activeUserId || !this.users[this.activeUserId]) return null;
      return this.users[this.activeUserId];
    }

    createUser(username, age) {
      const trimmed = (username || '').trim();
      if (!trimmed) throw new Error('유저 닉네임을 입력해 주세요.');
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 3 || parsedAge > 100) {
        throw new Error('올바른 연령(3세~100세)을 입력해 주세요.');
      }

      const userId = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const newUser = {
        id: userId,
        name: trimmed,
        age: parsedAge,
        gold: 500,
        gems: 10,
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

    login(userId) {
      if (!this.users[userId]) throw new Error('존재하지 않는 유저입니다.');
      this.users[userId].lastLoginAt = Date.now();
      this._saveActiveUserId(userId);
      this._saveUsers();
      return this.users[userId];
    }

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

    addCurrency(userId, gold = 0, gems = 0) {
      const user = this.users[userId];
      if (!user) return false;
      user.gold = Math.max(0, (user.gold || 0) + gold);
      user.gems = Math.max(0, (user.gems || 0) + gems);
      this._saveUsers();
      return true;
    }

    deductCurrency(userId, gold = 0, gems = 0) {
      const user = this.users[userId];
      if (!user) return false;
      if ((user.gold || 0) < gold || (user.gems || 0) < gems) return false;
      user.gold -= gold;
      user.gems -= gems;
      this._saveUsers();
      return true;
    }

    recordRunResult(userId, { score, goldEarned, gemsEarned, stageCleared }) {
      const user = this.users[userId];
      if (!user) return null;
      user.totalRuns = (user.totalRuns || 0) + 1;
      if (score > (user.highScore || 0)) user.highScore = score;
      user.gold = (user.gold || 0) + goldEarned;
      user.gems = (user.gems || 0) + gemsEarned;
      if (stageCleared && user.currentStage <= stageCleared) {
        user.currentStage = stageCleared + 1;
      }
      this._saveUsers();
      return user;
    }

    purchaseItem(userId, itemId) {
      const user = this.users[userId];
      if (!user) throw new Error('유저를 찾을 수 없습니다.');
      const item = getItemById(itemId);
      if (!item) throw new Error('존재하지 않는 아이템입니다.');
      if (user.inventory.includes(itemId)) throw new Error('이미 보유하고 있는 아이템입니다.');

      if (item.priceType === 'gold') {
        if (!this.deductCurrency(userId, item.price, 0)) throw new Error('골드가 부족합니다.');
      } else if (item.priceType === 'gem') {
        if (!this.deductCurrency(userId, 0, item.price)) throw new Error('보물(젬)이 부족합니다.');
      }

      user.inventory.push(itemId);
      this._saveUsers();
      return { success: true, item };
    }

    equipItem(userId, itemId) {
      const user = this.users[userId];
      if (!user) throw new Error('유저를 찾을 수 없습니다.');
      const item = getItemById(itemId);
      if (!item) throw new Error('존재하지 않는 아이템입니다.');
      if (!user.inventory.includes(itemId)) throw new Error('보유하지 않은 아이템은 장착할 수 없습니다.');
      if (!user.customization) user.customization = createDefaultCustomization();
      user.customization[item.category] = itemId;
      this._saveUsers();
      return { success: true, customization: user.customization };
    }
  }

  // ============================================================
  // 3. DifficultyManager (숫자 폭증 방지 & 뺄셈/나눗셈 적극 도입)
  // ============================================================
  class DifficultyManager {
    static getAgeTier(age) {
      if (age <= 7) return 'toddler';
      if (age <= 10) return 'junior';
      if (age <= 13) return 'middle';
      return 'pro';
    }

    static getConfig(age, stage = 1) {
      const tier = this.getAgeTier(age);
      const stageBonusSpeed = Math.min((stage - 1) * 8, 40);

      switch (tier) {
        case 'toddler':
          return {
            tier: 'toddler',
            tierName: '새싹 키즈 (7세 이하)',
            forwardSpeed: 150 + stageBonusSpeed * 0.4,
            lateralSpeed: 420,
            allowedOperators: ['+', '-'], // 곱셈, 나눗셈 절대 금지
            stairCostPerStep: 3,          // 무지개 7계단 1칸당 3명 소모
            targetCrowdGoal: 22 + Math.min((stage - 1) * 4, 15),
            stairStepsCount: 7,           // 7색 무지개 계단
            obstacleSpawnRate: 0.45,
            gatePairsCount: 10,           // 긴 트랙에 맞춘 게이트 증설
            maxDisplayCrowd: 70,
            description: '곱셈/나눗셈 없이 직관적인 덧셈(+)과 뺄셈(-)으로 귀여운 티니핑과 안전하게 달려요!'
          };

        case 'junior':
          return {
            tier: 'junior',
            tierName: '주니어 러너 (8~10세)',
            forwardSpeed: 185 + stageBonusSpeed * 0.6,
            lateralSpeed: 440,
            allowedOperators: ['+', '-', '*'],
            maxMultiplier: 2,
            stairCostPerStep: 5,          // 7계단 1칸당 5명 소모
            targetCrowdGoal: 36 + Math.min((stage - 1) * 5, 20),
            stairStepsCount: 7,           // 7색 무지개 계단
            obstacleSpawnRate: 0.55,
            gatePairsCount: 12,
            maxDisplayCrowd: 85,
            description: '더하기, 빼기와 전략적인 2배(×2) 게이트를 조율하여 7 무지개 계단을 정복하세요!'
          };

        case 'middle':
          return {
            tier: 'middle',
            tierName: '어드밴스드 (11~13세)',
            forwardSpeed: 215 + stageBonusSpeed * 0.8,
            lateralSpeed: 460,
            allowedOperators: ['+', '-', '*', '/'],
            maxMultiplier: 2,
            maxDivisor: 2,
            stairCostPerStep: 7,          // 7계단 1칸당 7명 소모
            targetCrowdGoal: 50 + Math.min((stage - 1) * 6, 25),
            stairStepsCount: 7,           // 7색 무지개 계단
            obstacleSpawnRate: 0.68,
            gatePairsCount: 14,
            maxDisplayCrowd: 100,
            description: '적극적인 뺄셈/나눗셈 게이트 속에서 최적의 경로를 찾아 7 무지개 계단 끝까지 돌파하세요!'
          };

        case 'pro':
        default:
          return {
            tier: 'pro',
            tierName: '마스터 러너 (14세 이상)',
            forwardSpeed: 245 + stageBonusSpeed,
            lateralSpeed: 480,
            allowedOperators: ['+', '-', '*', '/'],
            maxMultiplier: 3,
            maxDivisor: 3,
            stairCostPerStep: 9,          // 7계단 1칸당 9명 소모
            targetCrowdGoal: 65 + Math.min((stage - 1) * 8, 35),
            stairStepsCount: 7,           // 7색 무지개 계단
            obstacleSpawnRate: 0.78,
            gatePairsCount: 16,
            maxDisplayCrowd: 120,
            description: '함정 나눗셈과 감점 게이트를 뚫고 7 무지개 계단 정상의 황금 보물상자를 획득하세요!'
          };
      }
    }

    static generateGatePair(age, stage = 1, gateIndex = 0) {
      const config = this.getConfig(age, stage);
      const { allowedOperators, tier } = config;

      // 28% 확률로 둘 다 마이너스인 게이트 (피해 최소화 선택)
      const isDoubleNegativeGate = gateIndex > 1 && Math.random() < 0.28;

      let left, right;

      if (isDoubleNegativeGate) {
        if (tier === 'toddler') {
          left = { op: '-', val: 2 + Math.floor(Math.random() * 2) };
          right = { op: '-', val: 4 + Math.floor(Math.random() * 3) };
        } else {
          if (allowedOperators.includes('/') && Math.random() < 0.5) {
            left = { op: '/', val: 2 };
            right = { op: '-', val: 6 + Math.floor(Math.random() * 8) };
          } else {
            left = { op: '-', val: 4 + Math.floor(Math.random() * 6) };
            right = { op: '-', val: 10 + Math.floor(Math.random() * 10) };
          }
        }
      } else {
        const pickPositive = () => {
          if (allowedOperators.includes('*') && Math.random() < 0.18) {
            return { op: '*', val: 2 };
          }
          let addVal = 3 + Math.floor(Math.random() * 5);
          if (tier === 'middle' || tier === 'pro') addVal = 5 + Math.floor(Math.random() * 8);
          return { op: '+', val: addVal };
        };

        const pickNegative = () => {
          if (tier === 'toddler') {
            return { op: '-', val: 2 + Math.floor(Math.random() * 4) };
          }
          if (allowedOperators.includes('/') && Math.random() < 0.45) {
            return { op: '/', val: 2 };
          }
          return { op: '-', val: 4 + Math.floor(Math.random() * 10) };
        };

        left = pickPositive();
        right = pickNegative();
      }

      if (Math.random() < 0.5) {
        const temp = left;
        left = right;
        right = temp;
      }

      return {
        left: { op: left.op, val: left.val, text: formatOpText(left.op, left.val) },
        right: { op: right.op, val: right.val, text: formatOpText(right.op, right.val) }
      };
    }

    /**
     * [요구사항 2 해결] 각 라운드마다 계단 끝을 올라갈 수 있는 승리 경로(Winning Path) 100% 보장 생성기
     */
    static generateValidatedTrackGates(age, stage = 1) {
      const config = this.getConfig(age, stage);
      const { gatePairsCount, stairCostPerStep, stairStepsCount, allowedOperators, tier } = config;

      const requiredToReachTop = stairCostPerStep * stairStepsCount + 1;
      const targetOptimal = requiredToReachTop + 6;

      let gates = [];
      for (let i = 1; i <= gatePairsCount; i++) {
        gates.push(this.generateGatePair(age, stage, i));
      }

      let simCount = 1;
      for (const pair of gates) {
        simCount = Math.max(
          this.evaluateGate(simCount, pair.left.op, pair.left.val),
          this.evaluateGate(simCount, pair.right.op, pair.right.val)
        );
      }

      let iter = 0;
      while (simCount < targetOptimal && iter < 15) {
        iter++;
        const targetIdx = Math.floor(Math.random() * gates.length);
        const gate = gates[targetIdx];

        const boostOp = (tier !== 'toddler' && allowedOperators.includes('*') && Math.random() < 0.35) ? '*' : '+';
        const boostVal = (boostOp === '*')
          ? 2
          : (tier === 'toddler' ? 5 + Math.floor(Math.random() * 4) : 8 + Math.floor(Math.random() * 8));

        const boostedSide = Math.random() < 0.5 ? 'left' : 'right';
        gate[boostedSide] = {
          op: boostOp,
          val: boostVal,
          text: formatOpText(boostOp, boostVal)
        };

        simCount = 1;
        for (const pair of gates) {
          simCount = Math.max(
            this.evaluateGate(simCount, pair.left.op, pair.left.val),
            this.evaluateGate(simCount, pair.right.op, pair.right.val)
          );
        }
      }

      if (simCount < targetOptimal) {
        const deficit = targetOptimal - simCount;
        const lastGate = gates[gates.length - 1];
        const side = Math.random() < 0.5 ? 'left' : 'right';
        lastGate[side] = {
          op: '+',
          val: deficit + 4,
          text: `+${deficit + 4}`
        };
      }

      return gates;
    }

    static evaluateGate(currentCount, op, val) {
      let result = currentCount;
      switch (op) {
        case '+': result = currentCount + val; break;
        case '-': result = currentCount - val; break;
        case '*': result = currentCount * val; break;
        case '/': result = val > 0 ? Math.floor(currentCount / val) : currentCount; break;
      }
      return Math.max(0, Math.floor(result));
    }
  }

  function formatOpText(op, val) {
    if (op === '*') return `×${val}`;
    if (op === '/') return `÷${val}`;
    if (op === '+') return `+${val}`;
    if (op === '-') return `-${val}`;
    return `${op}${val}`;
  }

  // ============================================================
  // 4. SoundFx
  // ============================================================
  class SoundFx {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bgmPlaying = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
    }

    _init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playGatePositive() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.1);
      });
    }

    playGateNegative() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }

    playObstacleHit() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    playStairStep(pitch = 1.0) {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 400 * pitch;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playVictoryFanfare() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const melody = [
        { f: 392.00, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.35 }
      ];
      let t = this.ctx.currentTime;
      melody.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + n.d);
        t += n.d * 1.05;
      });
    }

    playCrownSparkle() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const bells = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0];
      bells.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const startT = this.ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, startT);
        gain.gain.setValueAtTime(0.14, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startT);
        osc.stop(startT + 0.35);
      });
    }

    playClick() {
      if (!this.enabled) return;
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    startBgm() {
      if (!this.enabled || this.bgmPlaying) return;
      this._init();
      if (!this.ctx) return;

      this.bgmPlaying = true;
      this.bgmStep = 0;

      const melodyNotes = [
        523.25, 659.25, 783.99, 880.00,
        783.99, 659.25, 523.25, 587.33,
        659.25, 783.99, 698.46, 587.33,
        523.25, 659.25, 587.33, 523.25
      ];

      const bassNotes = [
        130.81, 130.81, 130.81, 130.81,
        110.00, 110.00, 110.00, 110.00,
        87.31,  87.31,  87.31,  87.31,
        98.00,  98.00,  98.00,  98.00
      ];

      const stepDuration = 0.175;

      const playNextStep = () => {
        if (!this.bgmPlaying || !this.enabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        const freq = melodyNotes[this.bgmStep % melodyNotes.length];
        const bassFreq = bassNotes[this.bgmStep % bassNotes.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        if (this.bgmStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.045, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.33);
        }

        this.bgmStep = (this.bgmStep + 1) % melodyNotes.length;
        this.bgmTimer = setTimeout(playNextStep, stepDuration * 1000);
      };

      playNextStep();
    }

    stopBgm() {
      this.bgmPlaying = false;
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    toggleSound() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopBgm();
      } else {
        this.startBgm();
      }
      return this.enabled;
    }
  }

  const sound = new SoundFx();

  // ============================================================
  // 5. ParticleSystem (2D 오버레이)
  // ============================================================
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.floatingTexts = [];
    }

    reset() {
      this.particles = [];
      this.floatingTexts = [];
    }

    /**
     * 피격 또는 게이트 통과 시 부유 텍스트 생성 (-N, +N)
     */
    spawnFloatingText(x, y, text, color = '#ffffff') {
      this.floatingTexts.push({
        x,
        y,
        text,
        color,
        alpha: 1.0,
        scale: 1.4,
        vy: -48,
        life: 1.1
      });
    }

    spawnBurst(x, y, count = 20, colors = ['#00d2ff', '#ffffff', '#ffe600']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 20,
          size: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          gravity: 140,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0
        });
      }
    }

    spawnConfetti(x, y, count = 60) {
      const rainbow = ['#ff4b8b', '#00d2ff', '#ffe600', '#55ff77', '#ff9900', '#9d4edd'];
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const speed = 140 + Math.random() * 260;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 6,
          color: rainbow[Math.floor(Math.random() * rainbow.length)],
          alpha: 1.0,
          gravity: 220,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 10,
          life: 1.5 + Math.random() * 0.8,
          maxLife: 2.2
        });
      }
    }

    spawnFireworks(x, y, count = 70) {
      const fireColors = ['#ff0055', '#ffe600', '#00d2ff', '#00ff88', '#ff33bb', '#ffffff', '#ff9900'];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const speed = 90 + Math.random() * 240;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3.5 + Math.random() * 4,
          color: fireColors[Math.floor(Math.random() * fireColors.length)],
          alpha: 1.0,
          gravity: 90,
          life: 1.2 + Math.random() * 0.8,
          maxLife: 2.0
        });
      }
    }

    spawnFairyDust(x, y, count = 2) {
      const fairyColors = ['#ff9ebb', '#ffd166', '#a0e7e5', '#ffffff', '#ff70a6'];
      for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 28;
        const offsetY = (Math.random() - 0.5) * 16;
        this.particles.push({
          x: x + offsetX,
          y: y + offsetY,
          vx: (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 25,
          size: 2.2 + Math.random() * 2.5,
          color: fairyColors[Math.floor(Math.random() * fairyColors.length)],
          alpha: 0.9,
          gravity: -5,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8
        });
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        if (p.rotation !== undefined) p.rotation += p.rotSpeed * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / (p.maxLife || 1.0));
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      // 부유 텍스트 업데이트
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.scale = Math.max(1.0, ft.scale - dt * 0.45);
        ft.alpha = Math.max(0, ft.life);
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    render(ctx) {
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) {
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 부유 텍스트 렌더링 (-N, +N)
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = ft.alpha;
        ctx.save();
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);
        ctx.font = '900 28px "Noto Sans KR", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(ft.text, 0, 0);

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // ============================================================
  // 6. Stickman3D & CrowdManager3D
  // ============================================================
  class Stickman3D {
    static _faceTexture = null;

    static getFaceTexture() {
      if (this._faceTexture) return this._faceTexture;
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);

      const drawEye = (cx, cy) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#240046';
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 46, 0, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createLinearGradient(0, -42, 0, 42);
        grad.addColorStop(0, '#5a189a');
        grad.addColorStop(0.5, '#c77dff');
        grad.addColorStop(1, '#ff70a6');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 4, 28, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10002b';
        ctx.beginPath();
        ctx.ellipse(0, -2, 14, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-7, -14, 9, 13, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(8, 12, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#240046';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -40, 32, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.restore();
      };

      drawEye(78, 116);
      drawEye(178, 116);

      const drawBlush = (bx, by) => {
        const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
        bGrad.addColorStop(0, 'rgba(255, 75, 139, 0.75)');
        bGrad.addColorStop(1, 'rgba(255, 75, 139, 0)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBlush(50, 156);
      drawBlush(206, 156);

      ctx.strokeStyle = '#4a0e4e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(120, 162, 7.5, 0, Math.PI * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(136, 162, 7.5, 0.05, Math.PI);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      this._faceTexture = texture;
      return texture;
    }

    static createRoyalCrown(T) {
      const crownGroup = new THREE.Group();
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0xffaa00,
        emissiveIntensity: 0.25
      });

      const bandGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.08, 18);
      const band = new THREE.Mesh(bandGeo, goldMat);
      crownGroup.add(band);

      const peakGeo = new THREE.ConeGeometry(0.065, 0.22, 6);
      const jewelColors = [0xff0055, 0x00d2ff, 0x00ff88, 0x9b51e0, 0xff7700];

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.24;
        const z = Math.sin(angle) * 0.24;

        const peak = new THREE.Mesh(peakGeo, goldMat);
        peak.position.set(x, 0.12, z);
        peak.rotation.y = -angle;
        crownGroup.add(peak);

        const jewelGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const jewelMat = new THREE.MeshStandardMaterial({
          color: jewelColors[i],
          emissive: jewelColors[i],
          emissiveIntensity: 0.7,
          roughness: 0.1
        });
        const jewel = new THREE.Mesh(jewelGeo, jewelMat);
        jewel.position.set(x, 0.24, z);
        crownGroup.add(jewel);
      }

      const centerJewelGeo = new THREE.OctahedronGeometry(0.07);
      const centerJewelMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 0.85,
        roughness: 0.1
      });
      const centerJewel = new THREE.Mesh(centerJewelGeo, centerJewelMat);
      centerJewel.position.set(0, 0.15, 0.26);
      crownGroup.add(centerJewel);

      return crownGroup;
    }

    static createStickmanMesh(a, b) {
      const colorHex = (typeof a === 'string') ? a : (typeof b === 'string' ? b : '#ff9ebb');
      const group = new THREE.Group();

      const bodyColor = new THREE.Color(colorHex);
      const mat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.35,
        metalness: 0.1,
        emissive: bodyColor.clone().multiplyScalar(0.12)
      });

      const headPivot = new THREE.Group();
      headPivot.position.y = 0.92;
      group.add(headPivot);

      const headGeo = new THREE.SphereGeometry(0.38, 20, 16);
      const head = new THREE.Mesh(headGeo, mat);
      head.castShadow = true;
      headPivot.add(head);

      const faceTex = this.getFaceTexture();
      const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false });
      const facePlaneGeo = new THREE.PlaneGeometry(0.66, 0.66);
      const faceMesh = new THREE.Mesh(facePlaneGeo, faceMat);
      faceMesh.position.set(0, 0.02, 0.382);
      headPivot.add(faceMesh);

      const heartMat = new THREE.MeshStandardMaterial({
        color: 0xff1493,
        emissive: 0xff4081,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const heartGroup = new THREE.Group();
      heartGroup.position.set(0, 0.36, 0.22);

      const heartSphereGeo = new THREE.SphereGeometry(0.065, 10, 8);
      const hLeft = new THREE.Mesh(heartSphereGeo, heartMat);
      hLeft.position.set(-0.045, 0.04, 0);
      heartGroup.add(hLeft);

      const hRight = new THREE.Mesh(heartSphereGeo, heartMat);
      hRight.position.set(0.045, 0.04, 0);
      heartGroup.add(hRight);

      const hConeGeo = new THREE.ConeGeometry(0.09, 0.11, 8);
      hConeGeo.rotateX(Math.PI);
      const hCone = new THREE.Mesh(hConeGeo, heartMat);
      hCone.position.set(0, -0.025, 0);
      heartGroup.add(hCone);
      headPivot.add(heartGroup);

      const earGeo = new THREE.SphereGeometry(0.13, 12, 10);
      earGeo.scale(1.0, 1.4, 0.7);

      const earLeft = new THREE.Mesh(earGeo, mat);
      earLeft.position.set(-0.36, 0.12, -0.05);
      earLeft.rotation.z = 0.35;
      headPivot.add(earLeft);

      const earRight = new THREE.Mesh(earGeo, mat);
      earRight.position.set(0.36, 0.12, -0.05);
      earRight.rotation.z = -0.35;
      headPivot.add(earRight);

      const crownPivot = new THREE.Group();
      crownPivot.position.set(0, 0.36, 0);
      const crownMesh = this.createRoyalCrown(THREE);
      crownMesh.visible = false;
      crownPivot.add(crownMesh);
      headPivot.add(crownPivot);

      const dressMat = new THREE.MeshStandardMaterial({
        color: bodyColor.clone().offsetHSL(0, 0.1, 0.05),
        roughness: 0.4,
        emissive: bodyColor.clone().multiplyScalar(0.08)
      });
      const dressGeo = new THREE.CylinderGeometry(0.12, 0.28, 0.42, 16);
      const body = new THREE.Mesh(dressGeo, dressMat);
      body.position.y = 0.46;
      body.castShadow = true;
      group.add(body);

      const bowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const bowGeo = new THREE.BoxGeometry(0.16, 0.06, 0.06);
      const bow = new THREE.Mesh(bowGeo, bowMat);
      bow.position.set(0, 0.62, 0.18);
      group.add(bow);

      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        emissive: 0xffe6ff,
        emissiveIntensity: 0.4,
        roughness: 0.1
      });

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.2, 0.25, 0.32, 0.28);
      wingShape.quadraticCurveTo(0.38, 0.15, 0.25, 0.0);
      wingShape.quadraticCurveTo(0.15, -0.15, 0, 0);
      const wingGeo = new THREE.ShapeGeometry(wingShape);

      const leftWingPivot = new THREE.Group();
      leftWingPivot.position.set(-0.08, 0.52, -0.15);
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.scale.set(0.8, 0.8, 0.8);
      leftWingPivot.add(leftWing);
      group.add(leftWingPivot);

      const rightWingPivot = new THREE.Group();
      rightWingPivot.position.set(0.08, 0.52, -0.15);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.scale.set(-0.8, 0.8, 0.8);
      rightWingPivot.add(rightWing);
      group.add(rightWingPivot);

      const armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.26, 8);
      armGeo.translate(0, -0.13, 0);

      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.18, 0.60, 0);
      const leftArm = new THREE.Mesh(armGeo, mat);
      leftArmPivot.add(leftArm);
      group.add(leftArmPivot);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.18, 0.60, 0);
      const rightArm = new THREE.Mesh(armGeo, mat);
      rightArmPivot.add(rightArm);
      group.add(rightArmPivot);

      const legGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.26, 8);
      legGeo.translate(0, -0.13, 0);

      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.11, 0.26, 0);
      const leftLeg = new THREE.Mesh(legGeo, mat);
      leftLeg.castShadow = true;
      leftLegPivot.add(leftLeg);
      group.add(leftLegPivot);

      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.11, 0.26, 0);
      const rightLeg = new THREE.Mesh(legGeo, mat);
      rightLeg.castShadow = true;
      rightLegPivot.add(rightLeg);
      group.add(rightLegPivot);

      const shadowGeo = new THREE.CircleGeometry(0.32, 12);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      group.add(shadow);

      group.userData = {
        headPivot, head, body, crownPivot, crownMesh,
        leftWingPivot, rightWingPivot, leftArmPivot, rightArmPivot,
        leftLegPivot, rightLegPivot, mat, runPhase: Math.random() * Math.PI * 2
      };
      return group;
    }

    static updateStickmanAnimation(meshGroup, runTimer, state = 'running') {
      const d = meshGroup.userData;
      if (!d || !d.leftLegPivot) return;

      if (state === 'fallen') {
        meshGroup.rotation.x = Math.PI / 2;
        meshGroup.position.y = 0.15;
        return;
      }

      if (state === 'cheering') {
        const jump = Math.abs(Math.sin(runTimer * 8)) * 0.48;
        meshGroup.position.y = jump;

        d.leftArmPivot.rotation.z = Math.PI * 0.75;
        d.rightArmPivot.rotation.z = -Math.PI * 0.75;
        d.leftArmPivot.rotation.x = 0;
        d.rightArmPivot.rotation.x = 0;

        const wingFlutter = Math.sin(runTimer * 28) * 0.65;
        d.leftWingPivot.rotation.y = wingFlutter;
        d.rightWingPivot.rotation.y = -wingFlutter;

        if (d.headPivot) d.headPivot.rotation.z = Math.sin(runTimer * 6) * 0.12;

        d.leftLegPivot.rotation.x = 0;
        d.rightLegPivot.rotation.x = 0;
        return;
      }

      const cycle = runTimer * 14 + d.runPhase;
      const legAngle = Math.sin(cycle) * 0.75;
      const armAngle = Math.cos(cycle) * 0.65;
      const bobbing = Math.abs(Math.sin(cycle * 2)) * 0.08;

      meshGroup.position.y = bobbing;
      meshGroup.rotation.x = 0.08;

      d.leftLegPivot.rotation.x = legAngle;
      d.rightLegPivot.rotation.x = -legAngle;

      d.leftArmPivot.rotation.x = -armAngle;
      d.rightArmPivot.rotation.x = armAngle;
      d.leftArmPivot.rotation.z = 0.18;
      d.rightArmPivot.rotation.z = -0.18;

      const wingFlap = Math.sin(runTimer * 20 + d.runPhase) * 0.42;
      d.leftWingPivot.rotation.y = wingFlap;
      d.rightWingPivot.rotation.y = -wingFlap;

      if (d.headPivot) d.headPivot.rotation.z = Math.sin(cycle) * 0.06;
    }
  }

  class CrowdManager3D {
    constructor(scene, stickmanColor = '#ff9ebb') {
      this.scene = scene;
      this.stickmanColor = stickmanColor;
      this.crowdGroup = new THREE.Group();
      this.scene.add(this.crowdGroup);

      this.pool = [];
      this.displayMax = 80;
    }

    setColor(colorHex) {
      this.stickmanColor = colorHex;
      for (const s of this.pool) {
        if (s.userData.mat) {
          s.userData.mat.color.set(colorHex);
          s.userData.mat.emissive.set(new THREE.Color(colorHex).multiplyScalar(0.12));
        }
      }
    }

    updateCrowd(targetCount, centerX, centerZ, runTimer, state = 'running') {
      this.crowdGroup.position.set(centerX, 0, centerZ);
      const visualCount = Math.max(1, Math.min(targetCount, this.displayMax));

      while (this.pool.length < visualCount) {
        const s = Stickman3D.createStickmanMesh(this.stickmanColor);
        this.pool.push(s);
        this.crowdGroup.add(s);
      }

      const goldenAngle = 2.39996;
      const spacing = 0.52;

      for (let i = 0; i < this.pool.length; i++) {
        const s = this.pool[i];
        if (i < visualCount) {
          s.visible = true;
          if (visualCount === 1) {
            s.position.set(0, 0, 0);
          } else {
            const r = Math.sqrt(i) * spacing;
            const theta = i * goldenAngle;
            s.position.set(Math.cos(theta) * r, 0, Math.sin(theta) * (r * 0.85));
          }
          Stickman3D.updateStickmanAnimation(s, runTimer, state);
        } else {
          s.visible = false;
        }
      }
    }

    getCrowdRadius(count) {
      const visualCount = Math.min(count, this.displayMax);
      if (visualCount <= 1) return 0.45;
      return Math.sqrt(visualCount) * 0.52 * 0.85;
    }
  }

  // ============================================================
  // 7. Obstacles3D (4종 3D 장애물: 망치, 톱니, 가시, 싱크홀)
  // ============================================================
  class Obstacles3D {
    static createHammer(a, b, c) {
      const x = (c !== undefined) ? b : a;
      const z = (c !== undefined) ? c : b;
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const pivotPoint = new THREE.Group();
      pivotPoint.position.set(0, 4.2, 0);

      const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      shaftGeo.translate(0, -1.6, 0);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      pivotPoint.add(shaft);

      const headGeo = new THREE.BoxGeometry(1.6, 0.9, 0.9);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x8892b0, metalness: 0.8, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, -3.2, 0);
      head.castShadow = true;
      pivotPoint.add(head);

      group.add(pivotPoint);
      group.userData = {
        type: 'hammer',
        pivotPoint,
        swingSpeed: 2.2 + Math.random() * 0.8,
        swingPhase: Math.random() * Math.PI,
        width: 1.6,
        depth: 1.0,
        hitCooldown: 0
      };
      return group;
    }

    static createSawBlade(a, b, c, d) {
      const x = (d !== undefined) ? b : a;
      const z = (d !== undefined) ? c : b;
      const trackWidth = (d !== undefined) ? d : (c !== undefined && typeof c === 'number' ? c : 8);
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const sawMat = new THREE.MeshStandardMaterial({ color: 0xd90429, metalness: 0.85, roughness: 0.25 });
      const discGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 16);
      discGeo.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, sawMat);
      disc.position.y = 0.9;
      disc.castShadow = true;
      group.add(disc);

      const toothCount = 8;
      for (let i = 0; i < toothCount; i++) {
        const angle = (i / toothCount) * Math.PI * 2;
        const toothGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
        toothGeo.rotateZ(-Math.PI / 2);
        const tooth = new THREE.Mesh(toothGeo, sawMat);
        tooth.position.set(0, 0.9 + Math.sin(angle) * 0.9, Math.cos(angle) * 0.9);
        tooth.rotation.x = -angle;
        group.add(tooth);
      }

      group.userData = {
        type: 'saw',
        disc,
        moveSpeed: 3.0 + Math.random() * 1.5,
        dir: Math.random() < 0.5 ? 1 : -1,
        minX: -trackWidth / 2 + 1.2,
        maxX: trackWidth / 2 - 1.2,
        width: 1.8,
        depth: 1.8,
        hitCooldown: 0
      };
      return group;
    }

    static createSpikes(a, b, c) {
      const x = (c !== undefined) ? b : a;
      const z = (c !== undefined) ? c : b;
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const baseGeo = new THREE.BoxGeometry(2.4, 0.08, 1.8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.04;
      group.add(base);

      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xedf2f4, metalness: 0.9, roughness: 0.2 });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const spikeGeo = new THREE.ConeGeometry(0.12, 0.55, 6);
          const spike = new THREE.Mesh(spikeGeo, spikeMat);
          spike.position.set(-0.9 + c * 0.6, 0.28, -0.6 + r * 0.6);
          spike.castShadow = true;
          group.add(spike);
        }
      }

      group.userData = { type: 'spikes', width: 2.4, depth: 1.8, hitCooldown: 0 };
      return group;
    }

    static createSinkhole(a, b, c) {
      const x = (c !== undefined) ? b : a;
      const z = (c !== undefined) ? c : b;
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      const holeRadius = 1.35;

      const holeGeo = new THREE.CircleGeometry(holeRadius, 24);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x050508, depthWrite: false });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.rotation.x = -Math.PI / 2;
      hole.position.y = 0.03;
      group.add(hole);

      const rimGeo = new THREE.TorusGeometry(holeRadius, 0.08, 8, 24);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, roughness: 0.2 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.04;
      group.add(rim);

      group.userData = { type: 'sinkhole', radius: holeRadius, width: holeRadius * 2, depth: holeRadius * 2, hitCooldown: 0 };
      return group;
    }

    static updateObstacle(obsGroup, dt, timer) {
      const d = obsGroup.userData;
      if (!d) return;
      if (d.hitCooldown > 0) d.hitCooldown -= dt;

      if (d.type === 'hammer') {
        const angle = Math.sin(timer * d.swingSpeed + d.swingPhase) * (Math.PI * 0.38);
        d.pivotPoint.rotation.z = angle;
      } else if (d.type === 'saw') {
        obsGroup.position.x += d.dir * d.moveSpeed * dt;
        if (obsGroup.position.x > d.maxX) { obsGroup.position.x = d.maxX; d.dir = -1; }
        if (obsGroup.position.x < d.minX) { obsGroup.position.x = d.minX; d.dir = 1; }
        obsGroup.rotation.x += dt * 15 * d.dir;
      } else if (d.type === 'sinkhole') {
        const scale = 1.0 + Math.sin(timer * 5) * 0.04;
        obsGroup.scale.set(scale, 1, scale);
      }
    }
  }

  // ============================================================
  // 8. GameEngine3D (Three.js 3D 엔진)
  // ============================================================
  const GameState = {
    READY: 'READY',
    RUNNING: 'RUNNING',
    STAIR_PHASE: 'STAIR_PHASE',
    CINEMATIC_CHEST: 'CINEMATIC_CHEST',
    VICTORY: 'VICTORY',
    GAME_OVER: 'GAME_OVER'
  };

  class GameEngine3D {
    constructor(container, onGameEndCallback, onHudUpdateCallback) {
      this.container = container;
      this.onGameEnd = onGameEndCallback || (() => { });
      this.onHudUpdate = onHudUpdateCallback || (() => { });

      this.width = this.container.clientWidth || 400;
      this.height = this.container.clientHeight || 700;

      this.trackWidth = 8.0;
      this.trackLength = 450.0; // 도로 대폭 연장

      this.playerX = 0;
      this.targetPlayerX = 0;
      this.playerZ = 0;
      this.crowdCount = 1;
      this.stickmanColor = '#ff9ebb'; // 티니핑 시그니처 핑크

      this.state = GameState.READY;
      this.runTimer = 0;
      this.config = null;
      this.stage = 1;
      this.age = 8;

      this.isDragging = false;
      this.dragStartX = 0;
      this.dragPlayerStartX = 0;
      this.keys = { left: false, right: false };

      this.gates = [];
      this.obstacles = [];
      this.stairs = [];
      this.stairIndex = 0;
      this.stairTimer = 0;

      this.cinematicTimer = 0;
      this.cinematicStage = 0;
      this.chestLidPivot = null;
      this.chestLight = null;
      this.floatingCrown = null; // 상자에서 나와 머리에 씌워질 왕관
      this.coins3D = [];
      this.shakeIntensity = 0;
      this.isPaused = false;

      this.particles = new ParticleSystem();

      this._initThreeScene();
      this._bindEvents();
    }

    _initThreeScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0c1017);
      this.scene.fog = new THREE.FogExp2(0x0c1017, 0.012);

      this.camera = new THREE.PerspectiveCamera(54, this.width / this.height, 0.5, 350);
      this.cameraTarget = new THREE.Vector3(0, 1.5, 8);
      this.camera.position.set(0, 6.5, -7.5);
      this.camera.lookAt(this.cameraTarget);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;

      this.renderer.domElement.id = 'game-webgl-canvas';
      this.container.appendChild(this.renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      this.scene.add(ambientLight);

      this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
      this.dirLight.position.set(10, 20, 10);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.scene.add(this.dirLight);

      this.crowdManager = new CrowdManager3D(this.scene, this.stickmanColor);
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

    startLevel(user, stage = 1) {
      this.stage = stage;
      this.age = user ? user.age : 8;
      this.config = DifficultyManager.getConfig(this.age, this.stage);

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

      this._buildTrack3D();

      this.onHudUpdate({
        count: this.crowdCount,
        progress: 0,
        stage: this.stage,
        targetGoal: this.config.targetCrowdGoal
      });
    }

    _buildTrack3D() {
      if (this.trackGroup) this.scene.remove(this.trackGroup);
      this.trackGroup = new THREE.Group();
      this.scene.add(this.trackGroup);

      this.gates = [];
      this.obstacles = [];
      this.stairs = [];

      // 바닥
      const roadGeo = new THREE.BoxGeometry(this.trackWidth, 0.4, this.trackLength);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.7 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, -0.2, this.trackLength / 2);
      road.receiveShadow = true;
      this.trackGroup.add(road);

      // 레일
      const railMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff });
      const railGeo = new THREE.BoxGeometry(0.2, 0.35, this.trackLength);
      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(-this.trackWidth / 2, 0.05, this.trackLength / 2);
      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(this.trackWidth / 2, 0.05, this.trackLength / 2);
      this.trackGroup.add(leftRail);
      this.trackGroup.add(rightRail);

      // 게이트 & 4종 장애물 (승리 가능 승리 경로 100% 보장 생성)
      const { gatePairsCount, obstacleSpawnRate, stairStepsCount } = this.config;
      const gateInterval = this.trackLength / (gatePairsCount + 1);
      const validatedGatePairs = DifficultyManager.generateValidatedTrackGates(this.age, this.stage);

      for (let i = 1; i <= gatePairsCount; i++) {
        const z = i * gateInterval;
        const pair = validatedGatePairs[i - 1] || DifficultyManager.generateGatePair(this.age, this.stage, i);
        const gateMesh = this._createGate3DMesh(pair, z);
        this.trackGroup.add(gateMesh);

        this.gates.push({
          id: `gate_${i}`,
          z,
          left: { ...pair.left, passed: false },
          right: { ...pair.right, passed: false },
          meshGroup: gateMesh,
          passed: false
        });

        if (Math.random() < obstacleSpawnRate && i < gatePairsCount) {
          const obsZ = z + gateInterval * 0.52;
          const types = ['hammer', 'saw', 'spikes', 'sinkhole'];
          const chosen = types[Math.floor(Math.random() * types.length)];
          let obsMesh;

          if (chosen === 'hammer') {
            obsMesh = Obstacles3D.createHammer(0, obsZ);
          } else if (chosen === 'saw') {
            obsMesh = Obstacles3D.createSawBlade(0, obsZ, this.trackWidth);
          } else if (chosen === 'spikes') {
            const x = (Math.random() - 0.5) * (this.trackWidth * 0.5);
            obsMesh = Obstacles3D.createSpikes(x, obsZ);
          } else {
            const x = (Math.random() - 0.5) * (this.trackWidth * 0.4);
            obsMesh = Obstacles3D.createSinkhole(x, obsZ);
          }
          this.trackGroup.add(obsMesh);
          this.obstacles.push(obsMesh);
        }
      }

      // [요구사항 4] 7색 무지개 3D 입체 계단 (7 Rainbow Steps)
      const stairBaseZ = this.trackLength + 4.0;
      const stepDepth = 5.0;
      const stepHeight = 0.85;

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

        const sprite = this._createMultiplierSprite(`×${multiplier.toFixed(1)}`);
        sprite.position.set(0, stairY - 0.35, stairZ + 0.05);
        sprite.scale.set(3.2, 1.2, 1);
        this.trackGroup.add(sprite);

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

      // [요구사항 5] 골 플랫폼 & 보물상자
      const finalStairY = stairStepsCount * stepHeight;
      const goalPlatformZ = stairBaseZ + stairStepsCount * stepDepth;
      const goalPlatformLength = 22.0;

      const goalGeo = new THREE.BoxGeometry(this.trackWidth * 1.1, finalStairY, goalPlatformLength);
      const goalMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.4 });
      const goalPlatform = new THREE.Mesh(goalGeo, goalMat);
      goalPlatform.position.set(0, finalStairY / 2, goalPlatformZ + goalPlatformLength / 2);
      goalPlatform.receiveShadow = true;
      this.trackGroup.add(goalPlatform);

      // 플랫폼 바닥 황금 네온 라인들
      for (let l = 1; l <= 6; l++) {
        const stripeGeo = new THREE.BoxGeometry(this.trackWidth * 0.95, 0.05, 0.4);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, finalStairY + 0.03, goalPlatformZ + l * 3.2);
        this.trackGroup.add(stripe);
      }

      const chestZ = goalPlatformZ + 16.5;
      this._createTreasureChest3D(0, finalStairY, chestZ);
      this.goalPlatformZ = goalPlatformZ;
      this.goalPlatformY = finalStairY;
      this.chestZ = chestZ;
    }

    _createGate3DMesh(pair, z) {
      const group = new THREE.Group();
      group.position.set(0, 0, z);
      const halfW = this.trackWidth / 4;
      const gateW = this.trackWidth * 0.46;
      const gateH = 3.6;

      // 카메라가 +Z를 볼 때: 3D 상에서 +X는 화면 왼쪽, -X는 화면 오른쪽!
      const left = this._createGatePanelMesh(pair.left, gateW, gateH);
      left.position.set(halfW, gateH / 2, 0);
      group.add(left);

      const right = this._createGatePanelMesh(pair.right, gateW, gateH);
      right.position.set(-halfW, gateH / 2, 0);
      group.add(right);

      return group;
    }

    _createGatePanelMesh(gateInfo, width, height) {
      const group = new THREE.Group();
      const isPos = gateInfo.op === '+' || gateInfo.op === '*';
      const color = isPos ? 0x00d2ff : 0xe63946;

      const panelGeo = new THREE.BoxGeometry(width, height, 0.15);
      const panelMat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      group.add(panel);

      const sprite = this._createTextSprite(gateInfo.text);
      sprite.position.set(0, 0, 0.12);
      sprite.scale.set(width * 0.85, height * 0.5, 1);
      group.add(sprite);
      return group;
    }

    _createTextSprite(text) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.font = '900 68px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 12; ctx.strokeStyle = '#000000'; ctx.strokeText(text, 128, 64);
      ctx.fillStyle = '#ffffff'; ctx.fillText(text, 128, 64);
      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    }

    _createMultiplierSprite(text) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 96;
      const ctx = canvas.getContext('2d');
      ctx.font = '900 58px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = '#000000'; ctx.strokeText(text, 128, 48);
      ctx.fillStyle = '#ffe600'; ctx.fillText(text, 128, 48);
      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    }

    /**
     * [요구사항 3] 계단 밟는 윗면에 배치되는 대형 소모 인원수 라벨
     */
    _createStairTreadCostLabel(cost, multiplier) {
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

    _createTreasureChest3D(x, y, z) {
      const chestGroup = new THREE.Group();
      chestGroup.position.set(x, y, z);

      const chestMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, metalness: 0.3, roughness: 0.5 });
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.85, roughness: 0.2 });

      const bodyGeo = new THREE.BoxGeometry(2.4, 1.3, 1.6);
      const box = new THREE.Mesh(bodyGeo, chestMat);
      box.position.y = 0.65;
      chestGroup.add(box);

      const trimGeo = new THREE.BoxGeometry(2.45, 0.2, 1.65);
      const trim = new THREE.Mesh(trimGeo, goldTrimMat);
      trim.position.y = 1.25;
      chestGroup.add(trim);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 1.3, 0.8);
      const lidGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.4, 16, 1, false, 0, Math.PI);
      lidGeo.rotateZ(Math.PI / 2);
      lidGeo.translate(0, 0, -0.8);
      const lidMesh = new THREE.Mesh(lidGeo, goldTrimMat);
      lidPivot.add(lidMesh);
      chestGroup.add(lidPivot);
      this.chestLidPivot = lidPivot;

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
        const sensitivity = 0.024;
        const halfLimit = this.trackWidth / 2 - 0.8;
        this.targetPlayerX = Math.max(-halfLimit, Math.min(halfLimit, this.dragPlayerStartX + deltaX * sensitivity));
      };

      const onPointerUp = () => { this.isDragging = false; };

      dom.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      dom.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
      window.addEventListener('touchcancel', onPointerUp);

      // 키보드 조작
      window.addEventListener('keydown', (e) => {
        if (this.state !== GameState.RUNNING) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.keys.left = true; e.preventDefault(); }
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.keys.right = true; e.preventDefault(); }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      });
    }

    update(dt) {
      if (this.state === GameState.READY || this.isPaused) return;

      this.runTimer += dt;
      this.particles.update(dt);

      for (const obs of this.obstacles) {
        Obstacles3D.updateObstacle(obs, dt, this.runTimer);
      }

      if (this.state === GameState.RUNNING) {
        const halfLimit = this.trackWidth / 2 - 0.8;
        const lateralSpeed = 9.0;
        if (this.keys.left) this.targetPlayerX = Math.max(-halfLimit, this.targetPlayerX - lateralSpeed * dt);
        if (this.keys.right) this.targetPlayerX = Math.min(halfLimit, this.targetPlayerX + lateralSpeed * dt);

        this.playerX += (this.targetPlayerX - this.playerX) * Math.min(1, dt * 14);

        const forward3DSpeed = this.config.forwardSpeed * 0.085;
        this.playerZ += forward3DSpeed * dt;

        // 카메라가 +Z를 볼 때 화면상 좌우와 일치시키기 위해 3D X좌표는 -playerX로 배치
        const worldX = -this.playerX;

        // 카메라 백뷰 추적
        this.camera.position.set(worldX * 0.35, 6.0, this.playerZ - 8.5);
        this.cameraTarget.set(worldX * 0.7, 1.2, this.playerZ + 6.0);
        this.camera.lookAt(this.cameraTarget);

        this.dirLight.position.set(worldX + 10, 20, this.playerZ + 10);
        this.dirLight.target.position.set(worldX, 0, this.playerZ);

        this.crowdManager.updateCrowd(this.crowdCount, worldX, this.playerZ, this.runTimer, 'running');

        // 요정 별빛 가루 트레일 분출
        if (Math.random() < 0.35) {
          const screenPos = this._toScreenPos(worldX, 0.5, this.playerZ - 0.4);
          if (screenPos.visible) {
            this.particles.spawnFairyDust(screenPos.x, screenPos.y, 2);
          }
        }

        const progress = Math.min(100, Math.floor((this.playerZ / this.trackLength) * 100));
        this.onHudUpdate({
          count: this.crowdCount,
          progress,
          stage: this.stage,
          targetGoal: this.config.targetCrowdGoal
        });

        this._checkGateCollisions();
        this._checkObstacleCollisions(dt);

        if (this.playerZ >= this.trackLength) {
          this.state = GameState.STAIR_PHASE;
          this.stairIndex = 0;
          this.stairTimer = 0;
          this.targetPlayerX = 0;
        }

        if (this.crowdCount <= 0) {
          this._triggerGameOver();
        }
      } else if (this.state === GameState.STAIR_PHASE) {
        this._updateStairPhase(dt);
      } else if (this.state === GameState.CINEMATIC_CHEST) {
        this._updateCinematicChest(dt);
      } else if (this.state === GameState.VICTORY) {
        this.crowdManager.updateCrowd(this.crowdCount, this.playerX, this.playerZ, this.runTimer, 'cheering');
      }

      this._update3DCoins(dt);

      if (this.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.x += sx;
        this.camera.position.y += sy;
        this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
      }
    }

    _toScreenPos(worldX, worldY, worldZ) {
      if (!this.camera) return { x: this.width / 2, y: this.height / 2, visible: true };
      const v = new THREE.Vector3(worldX, worldY, worldZ);
      v.project(this.camera);
      const isInFront = v.z >= -1.0 && v.z <= 1.0;
      const x = isInFront ? (v.x * 0.5 + 0.5) * this.width : this.width / 2;
      const y = isInFront ? (-v.y * 0.5 + 0.5) * this.height : this.height * 0.55;
      return { x, y, visible: true };
    }

    _checkGateCollisions() {
      for (const g of this.gates) {
        if (g.passed) continue;

        if (this.playerZ >= g.z - 1.0 && this.playerZ <= g.z + 2.5) {
          g.passed = true;
          g.meshGroup.visible = false;

          const chosen = this.playerX < 0 ? g.left : g.right;
          const prev = this.crowdCount;
          const next = DifficultyManager.evaluateGate(this.crowdCount, chosen.op, chosen.val);
          const diff = next - prev;
          this.crowdCount = next;

          const screenPos = this._toScreenPos(-this.playerX, 2.4, this.playerZ);
          if (diff >= 0) {
            sound.playGatePositive();
            this.shakeIntensity = 0.12;
            this.particles.spawnBurst(screenPos.x, screenPos.y, 25, ['#00d2ff', '#ffffff', '#00ff88']);
            if (diff > 0) {
              this.particles.spawnFloatingText(screenPos.x, screenPos.y - 20, `+${diff}`, '#00ff88');
            }
          } else {
            sound.playGateNegative();
            this.shakeIntensity = 0.18;
            this.particles.spawnBurst(screenPos.x, screenPos.y, 20, ['#ff3366', '#ff9900']);
            this.particles.spawnFloatingText(screenPos.x, screenPos.y - 20, `${diff}`, '#ff3344');
          }

          if (this.crowdCount <= 0) {
            this._triggerGameOver();
            break;
          }
        }
      }
    }

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

            const loss = Math.min(this.crowdCount, 2 + Math.floor(Math.random() * 3));
            this.crowdCount = Math.max(0, this.crowdCount - loss);

            const screenPos = this._toScreenPos(-this.playerX, 2.2, this.playerZ);
            this.particles.spawnBurst(screenPos.x, screenPos.y, 20, ['#ff2244', '#ffffff', '#ff9900']);
            if (loss > 0) {
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

    _spawn3DCoinsBurst(x, y, z) {
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
        d.vy -= 9.8 * dt;

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

    render() {
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // ============================================================
  // 9. UIManager
  // ============================================================
  function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  class UIManager {
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
      this.screenLobby = document.getElementById('screen-lobby');
      this.screenGame = document.getElementById('screen-game');
      this.modalResult = document.getElementById('modal-result');
      this.modalPause = document.getElementById('modal-pause');
      this.modalShop = document.getElementById('modal-shop');
      this.modalUserSelect = document.getElementById('modal-user-select');

      this.userNameDisplay = document.getElementById('lobby-user-name');
      this.userAgeDisplay = document.getElementById('lobby-user-age');
      this.userTierBadge = document.getElementById('lobby-tier-badge');
      this.userTierDesc = document.getElementById('lobby-tier-desc');
      this.goldDisplay = document.getElementById('currency-gold');
      this.gemDisplay = document.getElementById('currency-gem');
      this.highScoreDisplay = document.getElementById('lobby-high-score');
      this.currentStageDisplay = document.getElementById('lobby-stage-badge');

      this.hudStage = document.getElementById('hud-stage');
      this.hudCrowdCount = document.getElementById('hud-crowd-count');
      this.hudProgressBar = document.getElementById('hud-progress-fill');
      this.hudGoalTarget = document.getElementById('hud-goal-target');

      this.resultTitle = document.getElementById('result-title');
      this.resultSubtitle = document.getElementById('result-subtitle');
      this.resultScore = document.getElementById('result-score');
      this.resultStairs = document.getElementById('result-stairs');
      this.resultGold = document.getElementById('result-gold');
      this.resultGems = document.getElementById('result-gems');
      this.btnNextStage = document.getElementById('btn-next-stage');
      this.btnRetry = document.getElementById('btn-retry');
      this.btnLobbyFromGame = document.getElementById('btn-lobby');

      this.shopCategoryTabs = document.getElementById('shop-category-tabs');
      this.shopItemsGrid = document.getElementById('shop-items-grid');
      this.shopGoldDisplay = document.getElementById('shop-gold');
      this.shopGemDisplay = document.getElementById('shop-gem');

      this.inputNewUserName = document.getElementById('input-new-user-name');
      this.inputNewUserAge = document.getElementById('input-new-user-age');
      this.userListContainer = document.getElementById('user-list-container');
    }

    _bindEvents() {
      const btnSound = document.getElementById('btn-toggle-sound');
      if (btnSound) {
        btnSound.addEventListener('click', () => {
          const enabled = sound.toggleSound();
          btnSound.textContent = enabled ? '🔊' : '🔇';
          if (enabled) sound.playClick();
        });
      }

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

      document.getElementById('btn-play').addEventListener('click', () => {
        sound.playClick();
        const user = this.userDb.getActiveUser();
        if (!user) { this.openUserSelectModal(); return; }
        this.showGameScreen();
        this.onStartGame(user, user.currentStage || 1);
      });

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
          this.onRestartGame(this.userDb.getActiveUser());
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

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          if (!this.screenGame.classList.contains('hidden')) {
            if (this.modalPause && this.modalPause.classList.contains('hidden')) {
              this.openPauseModal();
            } else if (this.modalPause) {
              this.closePauseModal();
            }
          }
        }
      });

      document.getElementById('btn-change-user').addEventListener('click', () => {
        sound.playClick();
        this.openUserSelectModal();
      });

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
          }
        }
      });

      document.getElementById('btn-open-shop').addEventListener('click', () => {
        sound.playClick();
        this.openShopModal();
      });

      document.getElementById('btn-close-shop').addEventListener('click', () => {
        sound.playClick();
        this.modalShop.classList.add('hidden');
        this.refreshLobby();
      });

      this.btnNextStage.addEventListener('click', () => {
        sound.playClick();
        this.modalResult.classList.add('hidden');
        this.onNextStage(this.userDb.getActiveUser());
      });

      this.btnRetry.addEventListener('click', () => {
        sound.playClick();
        this.modalResult.classList.add('hidden');
        this.onRestartGame(this.userDb.getActiveUser());
      });

      this.btnLobbyFromGame.addEventListener('click', () => {
        sound.playClick();
        this.modalResult.classList.add('hidden');
        this.showLobbyScreen();
      });

      document.getElementById('btn-create-user').addEventListener('click', () => {
        sound.playClick();
        try {
          this.userDb.createUser(this.inputNewUserName.value, this.inputNewUserAge.value);
          this.inputNewUserName.value = '';
          this.closeUserSelectModal();
          this.refreshAll();
        } catch (err) {
          alert(err.message);
        }
      });

      document.getElementById('btn-close-user-modal').addEventListener('click', () => {
        sound.playClick();
        if (!this.userDb.getActiveUser()) {
          alert('게임을 진행하려면 유저를 생성하거나 선택해야 합니다.');
          return;
        }
        this.closeUserSelectModal();
      });
    }

    showLobbyScreen() {
      sound.stopBgm();
      this.screenLobby.classList.remove('hidden');
      this.screenGame.classList.add('hidden');
      this.modalResult.classList.add('hidden');
      this.refreshAll();
    }

    showGameScreen() {
      this.screenLobby.classList.add('hidden');
      this.screenGame.classList.remove('hidden');
      this.modalResult.classList.add('hidden');
      if (this.modalPause) this.modalPause.classList.add('hidden');
      sound.startBgm();
    }

    openPauseModal() {
      if (this.modalPause) this.modalPause.classList.remove('hidden');
      sound.stopBgm();
      if (this.onPauseToggle) this.onPauseToggle(true);
    }

    closePauseModal() {
      if (this.modalPause) this.modalPause.classList.add('hidden');
      sound.startBgm();
      if (this.onPauseToggle) this.onPauseToggle(false);
    }

    refreshAll() { this.refreshLobby(); }

    refreshLobby() {
      const user = this.userDb.getActiveUser();
      if (!user) { this.openUserSelectModal(); return; }

      this.userNameDisplay.textContent = user.name;
      this.userAgeDisplay.textContent = `${user.age}세`;
      this.goldDisplay.textContent = (user.gold || 0).toLocaleString();
      this.gemDisplay.textContent = (user.gems || 0).toLocaleString();
      this.highScoreDisplay.textContent = (user.highScore || 0).toLocaleString();
      this.currentStageDisplay.textContent = `Stage ${user.currentStage || 1}`;

      const config = DifficultyManager.getConfig(user.age, user.currentStage || 1);
      this.userTierBadge.textContent = config.tierName;
      this.userTierDesc.textContent = config.description;

      if (config.tier === 'toddler') this.userTierBadge.className = 'tier-badge toddler';
      else if (config.tier === 'junior') this.userTierBadge.className = 'tier-badge junior';
      else this.userTierBadge.className = 'tier-badge default';

      document.querySelectorAll('.btn-quick-age').forEach(btn => {
        const btnAge = parseInt(btn.dataset.age, 10);
        btn.classList.toggle('active', DifficultyManager.getAgeTier(btnAge) === config.tier);
      });
    }

    openUserSelectModal() {
      this.modalUserSelect.classList.remove('hidden');
      this._renderUserList();
    }

    closeUserSelectModal() { this.modalUserSelect.classList.add('hidden'); }

    _renderUserList() {
      const users = this.userDb.getAllUsers();
      const activeUser = this.userDb.getActiveUser();
      this.userListContainer.innerHTML = '';

      if (users.length === 0) {
        this.userListContainer.innerHTML = '<p class="empty-tip">등록된 유저가 없습니다.</p>';
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

        const card = document.createElement('div');
        card.className = `shop-item-card ${isEquipped ? 'equipped' : ''} ${isOwned ? 'owned' : ''}`;

        let previewHtml = '';
        if (item.category === CustomizationCategory.SKIN_TONE && item.color) {
          previewHtml = `<div class="color-chip" style="background-color: ${item.color};"></div>`;
        } else {
          previewHtml = `<div class="item-icon-box">${item.icon || '✨'}</div>`;
        }

        let btnHtml = '';
        if (isEquipped) btnHtml = `<button class="btn-item-action equipped" disabled>장착 중</button>`;
        else if (isOwned) btnHtml = `<button class="btn-item-action equip">장착하기</button>`;
        else {
          const priceIcon = item.priceType === 'gem' ? '💎' : '🪙';
          btnHtml = `<button class="btn-item-action buy">${priceIcon} ${item.price.toLocaleString()}</button>`;
        }

        card.innerHTML = `
          <div class="item-preview">${previewHtml}</div>
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-desc">${escapeHtml(item.description)}</div>
          <div class="item-action-area">${btnHtml}</div>
        `;

        const btn = card.querySelector('.btn-item-action');
        if (btn && !isEquipped) {
          btn.addEventListener('click', () => {
            sound.playClick();
            try {
              if (isOwned) this.userDb.equipItem(user.id, item.id);
              else {
                this.userDb.purchaseItem(user.id, item.id);
                this.userDb.equipItem(user.id, item.id);
              }
              this.openShopModal();
              this.refreshLobby();
            } catch (e) { alert(e.message); }
          });
        }
        this.shopItemsGrid.appendChild(card);
      });
    }

    updateHud({ count, progress, stage, targetGoal }) {
      this.hudCrowdCount.textContent = count.toLocaleString();
      this.hudStage.textContent = `STAGE ${stage}`;
      this.hudProgressBar.style.width = `${progress}%`;
      this.hudGoalTarget.textContent = `목표: ${targetGoal}명`;
    }

    showResultModal(result) {
      sound.stopBgm();
      const user = this.userDb.getActiveUser();
      if (user) {
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
        this.resultSubtitle.textContent = `계단 꼭대기에서 보물상자를 열어 황금 보물을 획득했습니다! (×${result.multiplier.toFixed(1)})`;
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

  // ============================================================
  // 10. 메인 애플리케이션 부트스트랩
  // ============================================================
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-canvas-container');
    const particleCanvas = document.getElementById('particle-canvas');
    const particleCtx = particleCanvas.getContext('2d');
    const userDb = new UserDatabase();

    let engine = null;
    let uiManager = null;
    let currentPlayingStage = 1;

    function resizeCanvas() {
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 700;
      if (width > 0 && height > 0) {
        particleCanvas.width = width;
        particleCanvas.height = height;
        if (engine) engine.resize(width, height);
      }
    }

    function handleGameEnd(result) {
      uiManager.showResultModal(result);
    }

    function handleHudUpdate(hudData) {
      uiManager.updateHud(hudData);
    }

    function startGame(user, stage) {
      currentPlayingStage = stage || 1;
      resizeCanvas();
      engine.startLevel(user, currentPlayingStage);
    }

    function restartGame(user) {
      startGame(user, currentPlayingStage);
    }

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

    if (!userDb.getActiveUser()) {
      const users = userDb.getAllUsers();
      if (users.length === 0) userDb.createUser('러너_키즈', 7);
      else userDb.login(users[0].id);
      uiManager.refreshAll();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let lastTimestamp = performance.now();
    function loop(now) {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      try {
        engine.update(dt);
        engine.render();

        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        engine.particles.render(particleCtx);
      } catch (err) {
        console.error('Game loop error:', err);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  });

})();
