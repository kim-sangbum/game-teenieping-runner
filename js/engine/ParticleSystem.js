/**
 * ParticleSystem.js
 * 충돌, 게이트 통과, 보물상자 개봉 시 연출되는 2D/2.5D 파티클 및 부유 텍스트 관리
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
  }

  /**
   * 게이트 통과 시 대형 부유 텍스트 생성
   */
  spawnFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      scale: 1.4,
      vy: -45, // 위로 솟아오름
      life: 1.0 // 1초 지속
    });
  }

  /**
   * 스파크 / 폭죽 파티클 분출
   */
  spawnBurst(x, y, count = 15, colors = ['#00d2ff', '#ffffff', '#ffe600']) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
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

  /**
   * 보물상자 열림 컨페티(화려한 꽃가루) 분출
   */
  spawnConfetti(x, y, count = 50) {
    const rainbow = ['#ff4b8b', '#00d2ff', '#ffe600', '#55ff77', '#ff9900', '#9d4edd'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 120 + Math.random() * 240;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: rainbow[Math.floor(Math.random() * rainbow.length)],
        alpha: 1.0,
        gravity: 200,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2.0
      });
    }
  }

  /**
   * 왕관 착용 및 최종 승리 시 터지는 화려한 폭죽(Fireworks) 분출
   */
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

  /**
   * 티니핑 요정들이 달릴 때 은은하게 흩날리는 반짝이 별빛 가루
   */
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
    // 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.rotation !== undefined) p.rotation += p.rotSpeed * dt;

      p.life -= dt;
      p.alpha = Math.max(0, p.life / (p.maxLife || 1.0));

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 부유 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.scale = Math.max(1.0, ft.scale - dt * 0.5);
      ft.alpha = Math.max(0, ft.life);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // 파티클 렌더링
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

    // 부유 텍스트 렌더링
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.font = '900 24px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 텍스트 외곽선 (그림자)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(ft.text, 0, 0);

      // 텍스트 채우기
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}

