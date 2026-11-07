/**
 * DifficultyManager.js
 * 유저의 연령 및 스테이지에 기반한 동적 난이도 조절 시스템 (DDA)
 * 
 * [개편 사항]
 * 1. 숫자 폭증 방지: 덧셈/곱셈의 수치를 현실적으로 밸런싱.
 * 2. 감소 선택지 적극 도입: 게이트 통과 시 무조건 줄어드는 판넬(뺄셈, 나눗셈)을 적극 배치.
 *    - 일부 게이트 쌍은 둘 다 마이너스(피해 최소화 선택)로 구성하여 긴장감 부여.
 * 3. 7세 이하 키즈 모드: 곱셈/나눗셈 금지 유지, 대신 뺄셈 판넬을 적극 등장시켜 과도한 증식 방지.
 */

export class DifficultyManager {
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
      case 'toddler': // 7세 이하 (키즈)
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
          gatePairsCount: 10,           // 긴 트랙에 맞춘 게이트 수 증설
          maxDisplayCrowd: 70,
          description: '곱셈/나눗셈 없이 직관적인 덧셈(+)과 뺄셈(-)으로 귀여운 티니핑과 안전하게 달려요!'
        };

      case 'junior': // 8~10세
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
          gatePairsCount: 12,           // 긴 트랙에 맞춘 게이트 수 증설
          maxDisplayCrowd: 85,
          description: '더하기, 빼기와 전략적인 2배(×2) 게이트를 조율하여 7 무지개 계단을 정복하세요!'
        };

      case 'middle': // 11~13세
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
          gatePairsCount: 14,           // 긴 트랙에 맞춘 게이트 수 증설
          maxDisplayCrowd: 100,
          description: '적극적인 뺄셈/나눗셈 게이트 속에서 최적의 경로를 찾아 7 무지개 계단 끝까지 돌파하세요!'
        };

      case 'pro': // 14세 이상
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
          gatePairsCount: 16,           // 긴 트랙에 맞춘 게이트 수 증설
          maxDisplayCrowd: 120,
          description: '함정 나눗셈과 감점 게이트를 뚫고 7 무지개 계단 정상의 황금 보물상자를 획득하세요!'
        };
    }
  }

  /**
   * 게이트 쌍 생성 로직 (감소 선택지 적극 도입)
   */
  static generateGatePair(age, stage = 1, gateIndex = 0) {
    const config = this.getConfig(age, stage);
    const { allowedOperators, tier } = config;

    // 25% 확률로 "둘 다 감소인 위기 게이트" 생성 (피해 최소화 선택)
    const isDoubleNegativeGate = gateIndex > 1 && Math.random() < 0.28;

    let left, right;

    if (isDoubleNegativeGate) {
      // 둘 다 줄어드는 게이트 쌍
      if (tier === 'toddler') {
        // 7세 이하: 작은 뺄셈 vs 조금 더 큰 뺄셈
        left = { op: '-', val: 2 + Math.floor(Math.random() * 2) };
        right = { op: '-', val: 4 + Math.floor(Math.random() * 3) };
      } else {
        // 8세 이상: 나눗셈 vs 뺄셈
        if (allowedOperators.includes('/') && Math.random() < 0.5) {
          left = { op: '/', val: 2 };
          right = { op: '-', val: 6 + Math.floor(Math.random() * 8) };
        } else {
          left = { op: '-', val: 4 + Math.floor(Math.random() * 6) };
          right = { op: '-', val: 10 + Math.floor(Math.random() * 10) };
        }
      }
    } else {
      // 일반 게이트 쌍: 한쪽은 무조건 감소(또는 작은 이득), 다른 쪽은 증가
      // [요구사항 준수: 중간중간 무조건 줄어드는 선택지 반드시 배치]
      const pickPositive = () => {
        // 폭증 방지를 위해 곱셈은 20% 이하로만 드물게 등장
        if (allowedOperators.includes('*') && Math.random() < 0.18) {
          return { op: '*', val: 2 };
        }
        // 덧셈 수치 적절히 조절
        let addVal = 3 + Math.floor(Math.random() * 5); // 기본 +3 ~ +7
        if (tier === 'middle' || tier === 'pro') {
          addVal = 5 + Math.floor(Math.random() * 8); // +5 ~ +12
        }
        return { op: '+', val: addVal };
      };

      const pickNegative = () => {
        if (tier === 'toddler') {
          // 키즈: 뺄셈 -2 ~ -5
          return { op: '-', val: 2 + Math.floor(Math.random() * 4) };
        }

        // 주니어 이상: 나눗셈(/2) 또는 뺄셈(-5 ~ -15) 적극 도입
        if (allowedOperators.includes('/') && Math.random() < 0.45) {
          return { op: '/', val: 2 };
        }
        const subVal = 4 + Math.floor(Math.random() * 10);
        return { op: '-', val: subVal };
      };

      const pos = pickPositive();
      const neg = pickNegative();

      left = pos;
      right = neg;
    }

    // 50% 확률로 좌우 위치 셔플
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

    // 계단 끝(보물상자)까지 완주하기 위해 필요한 최소 군단 수 + 여유분
    const requiredToReachTop = stairCostPerStep * stairStepsCount + 1;
    const targetOptimal = requiredToReachTop + 6;

    let gates = [];
    for (let i = 1; i <= gatePairsCount; i++) {
      gates.push(this.generateGatePair(age, stage, i));
    }

    // 최선의 선택을 했을 때 도달 가능한 최대 인원 시뮬레이션 (시작: 1명)
    let simCount = 1;
    for (const pair of gates) {
      const afterLeft = this.evaluateGate(simCount, pair.left.op, pair.left.val);
      const afterRight = this.evaluateGate(simCount, pair.right.op, pair.right.val);
      simCount = Math.max(afterLeft, afterRight);
    }

    // 만약 최선의 경로를 선택해도 계단 완주 목표 인원에 미달하면, 게이트를 점진적으로 강화하여 100% 도달 가능하도록 보장
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

      // 재시뮬레이션
      simCount = 1;
      for (const pair of gates) {
        simCount = Math.max(
          this.evaluateGate(simCount, pair.left.op, pair.left.val),
          this.evaluateGate(simCount, pair.right.op, pair.right.val)
        );
      }
    }

    // 최종 안전망: 만약 여전히 부족할 경우 마지막 게이트 한쪽에 필요 인원 완벽 주입
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
      case '+':
        result = currentCount + val;
        break;
      case '-':
        result = currentCount - val;
        break;
      case '*':
        result = currentCount * val;
        break;
      case '/':
        result = val > 0 ? Math.floor(currentCount / val) : currentCount;
        break;
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
