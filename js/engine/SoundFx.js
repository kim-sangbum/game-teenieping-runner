/**
 * SoundFx.js
 * 브라우저 내장 Web Audio API 기반의 제로 디펜던시 사운드 효과 신디사이저
 */

export class SoundFx {
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
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * 긍정적인 게이트 통과 사운드 (인원 증가 - 도미솔 상승음)
   */
  playGatePositive() {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + i * 0.05 + 0.12);
    });
  }

  /**
   * 부정적인 게이트 통과 사운드 (인원 감소 - 하강 저음)
   */
  playGateNegative() {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  /**
   * 장애물 피격 충돌음
   */
  playObstacleHit() {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  /**
   * 계단 1칸 뛰어오를 때 경쾌한 뜀박질음
   */
  playStairStep(pitchMultiplier = 1.0) {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 400 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * 계단 꼭대기 도달 및 보물상자 개봉 승리 팡파레!
   */
  playVictoryFanfare() {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    // 솔-도-미-솔~ 팡파레 코드 진행
    const melody = [
      { f: 392.00, d: 0.12 }, // G4
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.35 }  // G5 (길게)
    ];

    let t = this.ctx.currentTime;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 1.05;
    });
  }

  /**
   * 황금 왕관 착용 시 울리는 영롱한 마법 차임 사운드
   */
  playCrownSparkle() {
    if (!this.enabled) return;
    this._init();
    if (!this.ctx) return;

    const bells = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0]; // C6, E6, G6, C7, E7
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

  /**
   * UI 버튼 탭음
   */
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

  /**
   * 경쾌하고 사랑스러운 티니핑 테마 배경음악 (Web Audio 신디사이저)
   */
  startBgm() {
    if (!this.enabled || this.bgmPlaying) return;
    this._init();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;

    const melodyNotes = [
      523.25, 659.25, 783.99, 880.00, // C5, E5, G5, A5
      783.99, 659.25, 523.25, 587.33, // G5, E5, C5, D5
      659.25, 783.99, 698.46, 587.33, // E5, G5, F5, D5
      523.25, 659.25, 587.33, 523.25  // C5, E5, D5, C5
    ];

    const bassNotes = [
      130.81, 130.81, 130.81, 130.81, // C3
      110.00, 110.00, 110.00, 110.00, // A2
      87.31,  87.31,  87.31,  87.31,  // F2
      98.00,  98.00,  98.00,  98.00   // G2
    ];

    const stepDuration = 0.175;

    const playNextStep = () => {
      if (!this.bgmPlaying || !this.enabled || !this.ctx) return;

      const now = this.ctx.currentTime;
      const freq = melodyNotes[this.bgmStep % melodyNotes.length];
      const bassFreq = bassNotes[this.bgmStep % bassNotes.length];

      // 1. 통통 튀는 요정 멜로디
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

      // 2. 부드러운 베이스 화음
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

export const sound = new SoundFx();

