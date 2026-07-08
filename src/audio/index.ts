export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;
  private volume: number = 0.3;

  constructor() {
    const saved = localStorage.getItem('poker_sound_enabled');
    if (saved) {
      this.enabled = saved === 'true';
    }
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('poker_sound_enabled', this.enabled.toString());
    if (this.enabled) {
      this.init();
      this.playButton();
    }
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 1, slideTo?: number) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.volume * vol, t + duration * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  private playNoise(duration: number, freq: number, vol = 1, type: BiquadFilterType = 'lowpass') {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (type === 'lowpass') {
        filter.frequency.exponentialRampToValueAtTime(100, t + duration);
    } else {
        filter.frequency.exponentialRampToValueAtTime(freq, t + duration);
    }
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + duration);
  }

  public playShuffle() {
    if (!this.enabled || !this.ctx) return;
    for(let i=0; i<8; i++) {
      setTimeout(() => {
        this.playNoise(0.05, 3000, 0.4, 'highpass');
      }, i * 40);
    }
  }

  public playDeal() {
    this.playNoise(0.12, 2500, 0.3, 'lowpass');
  }

  public playChipsMove() {
    if (!this.enabled || !this.ctx) return;
    // Simulate chips clinking
    for(let i=0; i<3; i++) {
      setTimeout(() => {
        this.playTone(3000 + Math.random()*1000, 'triangle', 0.05, 0.1);
        this.playTone(4000 + Math.random()*1000, 'sine', 0.05, 0.1);
      }, i * 30);
    }
  }

  public playDealerAnnounce(round: string) {
    if (!this.enabled || !this.ctx) return;
    if (round === 'flop') {
      this.playTone(300, 'square', 0.1, 0.2);
      setTimeout(() => this.playTone(400, 'square', 0.1, 0.2), 150);
      setTimeout(() => this.playTone(500, 'square', 0.2, 0.2), 300);
    } else if (round === 'turn') {
      this.playTone(600, 'square', 0.2, 0.2);
    } else if (round === 'river') {
      this.playTone(700, 'square', 0.2, 0.2);
      setTimeout(() => this.playTone(800, 'square', 0.3, 0.2), 150);
    }
  }

  public playCheck() {
    this.playTone(150, 'sine', 0.1, 0.5);
  }

  public playCall() {
    this.playChipsMove();
    this.playTone(1200, 'sine', 0.05, 0.3);
    setTimeout(() => this.playTone(1400, 'sine', 0.05, 0.3), 50);
  }

  public playRaise() {
    this.playChipsMove();
    this.playTone(1200, 'sine', 0.05, 0.4);
    setTimeout(() => this.playTone(1400, 'sine', 0.05, 0.4), 40);
    setTimeout(() => this.playTone(1600, 'sine', 0.05, 0.4), 80);
  }

  public playAllIn() {
    this.playChipsMove();
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.playTone(1000 + i * 200, 'sine', 0.05, 0.5), i * 30);
    }
  }

  public playFold() {
    this.playNoise(0.2, 800, 0.3);
  }

  public playWin() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.4, 0.4), i * 100);
    });
  }

  public playShowdown() {
    this.playWin();
  }

  public playSplit() {
    if (!this.enabled || !this.ctx) return;
    const notes = [440, 523.25, 659.25]; // A4, C5, E5 (Am)
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.3), i * 120);
    });
  }

  public playSplitPot() {
    this.playSplit();
  }

  public playPot() {
    this.playChipsMove();
  }

  public playButton() {
    this.playTone(600, 'sine', 0.05, 0.2);
  }

  public playModal() {
    this.playTone(400, 'sine', 0.1, 0.1);
  }

  public playYourTurn() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(880, 'sine', 0.1, 0.4);
    setTimeout(() => this.playTone(880, 'sine', 0.2, 0.4), 150);
  }

  public playRebuy() {
    this.playTone(800, 'sine', 0.1, 0.3);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.3), 100);
  }
}

export const soundManager = new SoundManager();
