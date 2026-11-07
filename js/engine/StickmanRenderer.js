/**
 * StickmanRenderer.js
 * 
 * [요구사항 준수]
 * - Phase 1에서는 일체의 복잡한 그래픽 리소스를 사용하지 않음.
 * - 오직 선(Line)과 원(Circle)으로만 구성된 절차적 졸라맨(Stickman) 렌더링.
 * - 1명부터 수백 명까지 Fermat's Spiral 기반의 유기적 군단(Crowd Swarm)으로 뭉쳐서 이동.
 * - 달리는 다리와 팔의 부드러운 스윙 애니메이션.
 */

export class StickmanRenderer {
  constructor() {
    this.spacing = 10; // 졸라맨 사이의 기본 간격
  }

  /**
   * 단일 졸라맨(Stickman) 드로잉
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x - 중심 X
   * @param {number} y - 발 기준 Y
   * @param {number} scale - 크기 비율 (원근감에 따라 조절)
   * @param {number} runCycle - 달리기 애니메이션 타이머
   * @param {string} strokeColor - 선 색상
   * @param {string} fillColor - 머리 채우기 색상
   * @param {'running' | 'cheering' | 'fallen'} state - 동작 상태
   */
  drawSingleStickman(ctx, x, y, scale = 1.0, runCycle = 0, strokeColor = '#00d2ff', fillColor = '#00d2ff', state = 'running') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const height = 28; // 기준 높이
    const headRadius = 4.5;
    const bodyLength = 11;
    const legLength = 10;
    const armLength = 8;

    if (state === 'fallen') {
      // 쓰러진 상태 (패배)
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.arc(0, -height + headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -height + headRadius * 2);
      ctx.lineTo(0, -legLength);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (state === 'cheering') {
      // 계단 꼭대기 승리 환호 포즈 (양팔 번쩍 만세!)
      const bounce = Math.abs(Math.sin(runCycle * 3)) * 6;
      ctx.translate(0, -bounce);

      // 머리
      ctx.beginPath();
      ctx.arc(0, -height, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 몸통
      const neckY = -height + headRadius;
      const hipY = -legLength;
      ctx.beginPath();
      ctx.moveTo(0, neckY);
      ctx.lineTo(0, hipY);
      ctx.stroke();

      // 양팔 만세 (V자)
      ctx.beginPath();
      ctx.moveTo(0, neckY + 2);
      ctx.lineTo(-7, neckY - 9);
      ctx.moveTo(0, neckY + 2);
      ctx.lineTo(7, neckY - 9);
      ctx.stroke();

      // 다리 (가볍게 벌린 스탠스)
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(-5, 0);
      ctx.moveTo(0, hipY);
      ctx.lineTo(5, 0);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // --- 기본 러닝(달리기) 모션 ---
    const bobbing = Math.abs(Math.sin(runCycle * 2)) * 2; // 달릴 때 위아래 통통 튐
    const legSwing = Math.sin(runCycle);
    const armSwing = Math.cos(runCycle);

    const headCenterY = -height + bobbing;
    const neckY = headCenterY + headRadius;
    const hipY = -legLength + bobbing * 0.5;

    // 1. 머리 (동그란 원)
    ctx.beginPath();
    ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. 몸통 (직선)
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // 3. 팔 (양팔 교차 스윙)
    const shoulderY = neckY + 2;
    // 왼쪽 팔
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-armSwing * armLength, shoulderY + 4 + Math.abs(armSwing) * 2);
    ctx.stroke();

    // 오른쪽 팔
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(armSwing * armLength, shoulderY + 4 + Math.abs(armSwing) * 2);
    ctx.stroke();

    // 4. 다리 (양다리 앞뒤 교차 스윙, 무릎 관절 효과)
    // 왼쪽 다리
    const leftFootX = -legSwing * 7;
    const leftFootY = Math.max(0, -Math.cos(runCycle) * 3);
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(leftFootX * 0.5, hipY + legLength * 0.55);
    ctx.lineTo(leftFootX, leftFootY);
    ctx.stroke();

    // 오른쪽 다리
    const rightFootX = legSwing * 7;
    const rightFootY = Math.max(0, Math.cos(runCycle) * 3);
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(rightFootX * 0.5, hipY + legLength * 0.55);
    ctx.lineTo(rightFootX, rightFootY);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 군단(Crowd) 전체 렌더링
   * 피보나치 나선(Fermat's Spiral) 알고리즘으로 인원수에 따라 유기적 원형 덩어리를 형성
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} centerX - 군단 중심 X
   * @param {number} centerY - 군단 중심 Y
   * @param {number} count - 현재 생존 인원수
   * @param {number} scale - 원근감 스케일
   * @param {number} runTimer - 글로벌 러닝 타이머
   * @param {string} color - 졸라맨 테마 색상
   * @param {'running' | 'cheering' | 'fallen'} state 
   */
  drawCrowd(ctx, centerX, centerY, count, scale = 1.0, runTimer = 0, color = '#00d2ff', state = 'running') {
    if (count <= 0) return;

    // 1명일 때는 정확히 중앙
    if (count === 1) {
      this.drawSingleStickman(ctx, centerX, centerY, scale, runTimer * 12, color, color, state);
      return;
    }

    // 2명 이상일 때: 골든 앵글 피보나치 나선 클러스터링
    const goldenAngle = 2.39996; // 137.5도 (라디안)
    const effectiveSpacing = Math.max(6, 12 - Math.min(count * 0.04, 5)); // 인원이 많아지면 약간 더 밀집

    // 화면 밖이나 깊이에 맞게 정렬(뒤에 있는 캐릭터 먼저 렌더링하여 원근감 깊이감 표현)
    const members = [];
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(i) * effectiveSpacing * scale;
      const theta = i * goldenAngle;
      const offsetX = Math.cos(theta) * r;
      const offsetY = Math.sin(theta) * (r * 0.55); // 세로 방향을 타원형으로 살짝 납작하게 만들어 러닝 뷰에 맞춤

      members.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
        phase: i * 0.23,
        order: offsetY
      });
    }

    // Y축 기준 정렬 (위에 있는 캐릭터를 먼저 그려서 아래 캐릭터가 가리도록)
    members.sort((a, b) => a.order - b.order);

    for (const m of members) {
      const cycle = runTimer * 12 + m.phase;
      this.drawSingleStickman(ctx, m.x, m.y, scale, cycle, color, color, state);
    }
  }

  /**
   * 군단의 대략적인 외접 반경(Bounding Radius) 계산 (충돌 판정용)
   */
  getCrowdRadius(count, scale = 1.0) {
    if (count <= 1) return 12 * scale;
    const effectiveSpacing = Math.max(6, 12 - Math.min(count * 0.04, 5));
    return Math.sqrt(count) * effectiveSpacing * scale * 0.75;
  }
}

