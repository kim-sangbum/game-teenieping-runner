/**
 * CustomizationSchema.js
 * 캐릭터 커스터마이징 데이터 스키마 및 상점 카탈로그
 * 
 * [주의사항 준수]
 * - Phase 1에서는 티니핑 스타일의 인간형 캐릭터나 복잡한 그래픽 리소스를 렌더링하지 않음.
 * - 단, 추후 그래픽 리소스가 투입될 때 즉시 1:1로 매핑될 수 있도록
 *   완벽한 카테고리 스키마(성별, 헤어, 피부, 의상, 악세사리, 오라)와
 *   인벤토리 해금/장착/재화 소모 상태 관리 로직을 구축함.
 */

export const CustomizationCategory = {
  GENDER: 'gender',
  SKIN_TONE: 'skinTone',
  HAIR_STYLE: 'hairStyle',
  OUTFIT: 'outfit',
  ACCESSORY: 'accessory',
  AURA: 'aura'
};

/**
 * 상점 카탈로그 정의
 */
export const ShopCatalog = [
  // --- 성별 (기본 무료) ---
  {
    id: 'gender_neutral',
    category: CustomizationCategory.GENDER,
    name: '기본 중성',
    description: '어디에나 어울리는 깔끔한 기본 체형',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    visualTag: 'neutral'
  },
  {
    id: 'gender_boy',
    category: CustomizationCategory.GENDER,
    name: '보이시 스타일',
    description: '활기차고 씩씩한 체형 스타일',
    priceType: 'gold',
    price: 100,
    isDefault: false,
    visualTag: 'boy'
  },
  {
    id: 'gender_girl',
    category: CustomizationCategory.GENDER,
    name: '소녀 스타일',
    description: '발랄하고 경쾌한 체형 스타일',
    priceType: 'gold',
    price: 100,
    isDefault: false,
    visualTag: 'girl'
  },

  // --- 피부톤 (티니핑 컬러 테마) ---
  {
    id: 'skin_default',
    category: CustomizationCategory.SKIN_TONE,
    name: '하츄핑 핑크',
    description: '사랑의 티니핑 하츄핑 시그니처 핑크',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    color: '#ff9ebb'
  },
  {
    id: 'skin_peach',
    category: CustomizationCategory.SKIN_TONE,
    name: '조아핑 피치',
    description: '친절의 티니핑 조아핑 따뜻한 살구빛',
    priceType: 'gold',
    price: 150,
    isDefault: false,
    color: '#ffcba4'
  },
  {
    id: 'skin_lemon',
    category: CustomizationCategory.SKIN_TONE,
    name: '방글핑 옐로우',
    description: '웃음의 티니핑 방글핑 햇살 레몬빛',
    priceType: 'gold',
    price: 200,
    isDefault: false,
    color: '#ffe600'
  },
  {
    id: 'skin_rose',
    category: CustomizationCategory.SKIN_TONE,
    name: '믿어핑 로즈',
    description: '믿음의 티니핑 믿어핑 짙은 로즈빛',
    priceType: 'gold',
    price: 250,
    isDefault: false,
    color: '#ff4b8b'
  },
  {
    id: 'skin_obsidian',
    category: CustomizationCategory.SKIN_TONE,
    name: '매지컬 퍼플',
    description: '신비로운 마법의 보라빛',
    priceType: 'gem',
    price: 5,
    isDefault: false,
    color: '#5c4d7d'
  },

  // --- 헤어 스타일 ---
  {
    id: 'hair_basic',
    category: CustomizationCategory.HAIR_STYLE,
    name: '민머리 (베이직)',
    description: '미니멀한 기본형 헤어',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    icon: '🧑‍🦲'
  },
  {
    id: 'hair_spiky',
    category: CustomizationCategory.HAIR_STYLE,
    name: '스파이키 숏',
    description: '바람을 가르는 날렵한 뾰족머리',
    priceType: 'gold',
    price: 300,
    isDefault: false,
    icon: '⚡'
  },
  {
    id: 'hair_ponytail',
    category: CustomizationCategory.HAIR_STYLE,
    name: '하이 포니테일',
    description: '달릴 때 찰랑이는 포니테일',
    priceType: 'gold',
    price: 350,
    isDefault: false,
    icon: '👱‍♀️'
  },
  {
    id: 'hair_cap',
    category: CustomizationCategory.HAIR_STYLE,
    name: '스트릿 스냅백',
    description: '스포티한 힙스터 모자',
    priceType: 'gem',
    price: 8,
    isDefault: false,
    icon: '🧢'
  },

  // --- 의상 ---
  {
    id: 'outfit_runner',
    category: CustomizationCategory.OUTFIT,
    name: '베이직 트랙슈트',
    description: '달리기에 최적화된 가벼운 유니폼',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    icon: '🎽'
  },
  {
    id: 'outfit_hoodie',
    category: CustomizationCategory.OUTFIT,
    name: '네온 후드티',
    description: '편안하고 스타일리시한 후드',
    priceType: 'gold',
    price: 400,
    isDefault: false,
    icon: '🧥'
  },
  {
    id: 'outfit_cape',
    category: CustomizationCategory.OUTFIT,
    name: '영웅의 망토',
    description: '바람에 펄럭이는 멋진 슈퍼히어로 망토',
    priceType: 'gem',
    price: 10,
    isDefault: false,
    icon: '🦸'
  },
  {
    id: 'outfit_royal',
    category: CustomizationCategory.OUTFIT,
    name: '로열 가디언 코트',
    description: '황금 장식이 수놓아진 최고급 코트',
    priceType: 'gem',
    price: 20,
    isDefault: false,
    icon: '👑'
  },

  // --- 소품 / 악세사리 ---
  {
    id: 'acc_none',
    category: CustomizationCategory.ACCESSORY,
    name: '장착 안 함',
    description: '가벼운 몸 상태 유지',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    icon: '❌'
  },
  {
    id: 'acc_glasses',
    category: CustomizationCategory.ACCESSORY,
    name: '쿨 선글라스',
    description: '자외선과 적을 차단하는 힙한 안경',
    priceType: 'gold',
    price: 250,
    isDefault: false,
    icon: '🕶️'
  },
  {
    id: 'acc_headphone',
    category: CustomizationCategory.ACCESSORY,
    name: '무선 헤드셋',
    description: '신나는 비트를 들으며 러닝!',
    priceType: 'gold',
    price: 350,
    isDefault: false,
    icon: '🎧'
  },
  {
    id: 'acc_crown',
    category: CustomizationCategory.ACCESSORY,
    name: '챔피언 골드 크라운',
    description: '승리자만이 착용할 수 있는 왕관',
    priceType: 'gem',
    price: 15,
    isDefault: false,
    icon: '👑'
  },

  // --- 오라 (발 밑 또는 주변 이펙트) ---
  {
    id: 'aura_none',
    category: CustomizationCategory.AURA,
    name: '오라 없음',
    description: '기본 상태',
    priceType: 'gold',
    price: 0,
    isDefault: true,
    icon: '⚪'
  },
  {
    id: 'aura_spark',
    category: CustomizationCategory.AURA,
    name: '번개 스파크',
    description: '발걸음마다 튀는 파란색 전기 불꽃',
    priceType: 'gold',
    price: 500,
    isDefault: false,
    icon: '⚡'
  },
  {
    id: 'aura_hearts',
    category: CustomizationCategory.AURA,
    name: '러브 하트 빔',
    description: '따뜻한 하트들이 퐁퐁 솟아납니다',
    priceType: 'gold',
    price: 500,
    isDefault: false,
    icon: '💖'
  },
  {
    id: 'aura_starlight',
    category: CustomizationCategory.AURA,
    name: '스타라이트 갤럭시',
    description: '우주의 별빛이 무리를 감쌉니다',
    priceType: 'gem',
    price: 25,
    isDefault: false,
    icon: '✨'
  }
];

/**
 * 기본 커스터마이징 장착 상태 생성 헬퍼
 */
export function createDefaultCustomization() {
  return {
    [CustomizationCategory.GENDER]: 'gender_neutral',
    [CustomizationCategory.SKIN_TONE]: 'skin_default',
    [CustomizationCategory.HAIR_STYLE]: 'hair_basic',
    [CustomizationCategory.OUTFIT]: 'outfit_runner',
    [CustomizationCategory.ACCESSORY]: 'acc_none',
    [CustomizationCategory.AURA]: 'aura_none'
  };
}

/**
 * 기본 인벤토리(해금된 기본 아이템 목록) 생성 헬퍼
 */
export function createDefaultInventory() {
  return ShopCatalog
    .filter(item => item.isDefault)
    .map(item => item.id);
}

/**
 * 특정 카테고리의 아이템 목록 반환
 */
export function getItemsByCategory(category) {
  return ShopCatalog.filter(item => item.category === category);
}

/**
 * ID로 아이템 단건 조회
 */
export function getItemById(itemId) {
  return ShopCatalog.find(item => item.id === itemId) || null;
}

