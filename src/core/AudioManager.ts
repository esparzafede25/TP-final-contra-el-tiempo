import { SaveManager } from './SaveManager';

export type MusicTrack = 'title' | 'level1' | 'level2' | 'level3' | 'boss' | 'victory' | 'gameover' | 'none';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private currentTrack: MusicTrack = 'none';
  private isPlayingMusic: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  private masterVolume: number = 0.8;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.9;

  private isMuted: boolean = false;

  private constructor() {
    const settings = SaveManager.loadSettings();
    this.masterVolume = settings.masterVolume;
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;

    // Listen to first user gesture to unlock AudioContext
    const unlockAudio = () => {
      this.initContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateVolumes();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain) return;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx?.currentTime || 0);
    this.musicGain.gain.setValueAtTime(this.musicVolume * 0.4, this.ctx?.currentTime || 0);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume * 0.6, this.ctx?.currentTime || 0);
  }

  public setVolumes(master: number, music: number, sfx: number): void {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.updateVolumes();

    const settings = SaveManager.loadSettings();
    settings.masterVolume = this.masterVolume;
    settings.musicVolume = this.musicVolume;
    settings.sfxVolume = this.sfxVolume;
    SaveManager.saveSettings(settings);
  }

  public getVolumes() {
    return {
      master: this.masterVolume,
      music: this.musicVolume,
      sfx: this.sfxVolume,
    };
  }

  // --- Retro Sound Effects Synthesis ---

  public playPunchLight(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Pitch drop tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // Quick white noise snap
    this.playNoise(0.05, 0.4);
  }

  public playPunchHeavy(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoise(0.12, 0.7);
  }

  public playKick(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.16);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);

    this.playNoise(0.08, 0.5);
  }

  public playAirKick(): void {
    this.playWhoosh();
    setTimeout(() => this.playKick(), 40);
  }

  public playWhoosh(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playJump(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playLand(): void {
    this.playNoise(0.08, 0.3);
  }

  public playHurt(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
    this.playNoise(0.15, 0.5);
  }

  public playKnockdown(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
    this.playNoise(0.25, 0.8);
  }

  public playBreakItem(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
    this.playNoise(0.2, 0.7);
  }

  public playPickup(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.35, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  public playNotification(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [784, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.4, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.2);
    });
  }

  public playClockTick(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playTyping(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const freq = 1200 + Math.random() * 800;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playSubmit(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Victory fanfare chords
    const chord1 = [523.25, 659.25, 783.99]; // C major
    const chord2 = [587.33, 739.99, 880.0];  // D major
    const chord3 = [659.25, 830.61, 987.77]; // E major
    const chord4 = [1046.5, 1318.5, 1567.98]; // High C

    const playChord = (chord: number[], timeOffset: number, duration: number) => {
      chord.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + timeOffset);

        gain.gain.setValueAtTime(0.25, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + duration);
      });
    };

    playChord(chord1, 0.0, 0.18);
    playChord(chord2, 0.18, 0.18);
    playChord(chord3, 0.36, 0.18);
    playChord(chord4, 0.54, 0.8);
  }

  public playPopupAlert(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  private playNoise(duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    // Filter to give retro crunch
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // --- Procedural Chiptune Music Synthesizer ---

  public playMusic(track: MusicTrack): void {
    if (this.currentTrack === track && this.isPlayingMusic) return;
    this.stopMusic();

    this.currentTrack = track;
    if (track === 'none') return;

    this.initContext();
    this.isPlayingMusic = true;
    this.musicStep = 0;

    // Tempo in ms per 16th note
    let stepMs = 125; // 120 BPM
    if (track === 'title') stepMs = 135;
    if (track === 'level1') stepMs = 115; // upbeat funk
    if (track === 'level2') stepMs = 120; // steady groove
    if (track === 'level3') stepMs = 105; // tense fast
    if (track === 'boss') stepMs = 95;    // intense rapid
    if (track === 'victory') stepMs = 140;
    if (track === 'gameover') stepMs = 200;

    this.musicInterval = window.setInterval(() => {
      this.tickMusicStep();
    }, stepMs);
  }

  public stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isPlayingMusic = false;
    this.currentTrack = 'none';
  }

  private tickMusicStep(): void {
    if (!this.ctx || !this.musicGain || !this.isPlayingMusic) return;
    const now = this.ctx.currentTime;
    const step = this.musicStep;

    switch (this.currentTrack) {
      case 'title':
        this.renderTitleStep(step, now);
        break;
      case 'level1':
        this.renderLevel1Step(step, now);
        break;
      case 'level2':
        this.renderLevel2Step(step, now);
        break;
      case 'level3':
        this.renderLevel3Step(step, now);
        break;
      case 'boss':
        this.renderBossStep(step, now);
        break;
      case 'victory':
        this.renderVictoryStep(step, now);
        break;
      case 'gameover':
        this.renderGameOverStep(step, now);
        break;
    }

    this.musicStep = (this.musicStep + 1) % 64;
  }

  private noteToFreq(semitonesFromA4: number): number {
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  }

  // Play a simple musical tone
  private playTone(freq: number, dur: number, type: OscillatorType, vol: number, startTime: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(vol * 0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  private playPercussion(type: 'kick' | 'snare' | 'hihat', startTime: number): void {
    if (!this.ctx || !this.musicGain) return;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, startTime);
      osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.12);

      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    } else if (type === 'snare') {
      const dur = 0.12;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);

      noise.connect(gain);
      gain.connect(this.musicGain);
      noise.start(startTime);
    } else if (type === 'hihat') {
      const dur = 0.04;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + dur);

      noise.connect(gain);
      gain.connect(this.musicGain);
      noise.start(startTime);
    }
  }

  // --- Theme Tracks Sequences ---

  private renderTitleStep(s: number, t: number): void {
    // Drum track
    if (s % 8 === 0) this.playPercussion('kick', t);
    if (s % 8 === 4) this.playPercussion('snare', t);
    if (s % 2 === 0) this.playPercussion('hihat', t);

    // Bassline (A minor / D minor groove)
    const bassNotes = [-24, -24, -20, -17, -24, -24, -15, -17, -22, -22, -18, -15, -24, -20, -17, -12];
    const bNote = bassNotes[s % 16];
    this.playTone(this.noteToFreq(bNote), 0.18, 'triangle', 0.6, t);

    // Lead melody
    const leadNotes: { [step: number]: number } = {
      0: 0, 3: 3, 6: 7, 8: 10, 10: 7, 12: 3, 14: 0,
      16: 5, 19: 8, 22: 12, 24: 15, 26: 12, 28: 8, 30: 5,
      32: 3, 34: 5, 36: 7, 38: 10, 40: 12, 44: 10, 46: 7,
      48: 0, 52: -2, 56: -5, 60: 0
    };
    if (leadNotes[s] !== undefined) {
      this.playTone(this.noteToFreq(leadNotes[s]), 0.22, 'square', 0.5, t);
    }
  }

  private renderLevel1Step(s: number, t: number): void {
    // Upbeat, psychedelic bouncy track (E minor)
    if (s % 8 === 0 || s % 8 === 6) this.playPercussion('kick', t);
    if (s % 8 === 4) this.playPercussion('snare', t);
    this.playPercussion('hihat', t);

    // Arpeggiated synth
    const arp = [-17, -14, -10, -5, -2, 2, 7, 10];
    this.playTone(this.noteToFreq(arp[s % 8]), 0.09, 'sawtooth', 0.22, t);

    // Bass
    if (s % 4 === 0) {
      const bNotes = [-29, -29, -25, -27];
      this.playTone(this.noteToFreq(bNotes[Math.floor(s / 16) % 4]), 0.25, 'triangle', 0.7, t);
    }

    // Melody riffs
    const melody: { [step: number]: number } = {
      0: 7, 4: 10, 8: 12, 12: 15, 16: 14, 20: 10, 24: 7, 28: 5,
      32: 7, 36: 12, 40: 14, 44: 17, 48: 15, 52: 12, 56: 10, 60: 7
    };
    if (melody[s] !== undefined) {
      this.playTone(this.noteToFreq(melody[s]), 0.25, 'square', 0.45, t);
    }
  }

  private renderLevel2Step(s: number, t: number): void {
    // Domestic chores rhythm: funky, syncopated (G minor / C minor)
    if (s % 8 === 0 || s % 8 === 3) this.playPercussion('kick', t);
    if (s % 8 === 4) this.playPercussion('snare', t);
    if (s % 2 === 0) this.playPercussion('hihat', t);

    // Walking bass
    const bass = [-26, -26, -23, -21, -26, -19, -21, -23];
    this.playTone(this.noteToFreq(bass[s % 8]), 0.16, 'triangle', 0.65, t);

    // Playful quirky leads
    const riffs: { [step: number]: number } = {
      2: -2, 4: 1, 6: 5, 8: 8, 11: 5, 14: 1,
      18: 3, 20: 6, 22: 10, 26: 8, 30: 5,
      34: -2, 36: 1, 38: 5, 42: 8, 46: 10, 48: 12,
      50: 10, 54: 8, 58: 5, 62: 1
    };
    if (riffs[s] !== undefined) {
      this.playTone(this.noteToFreq(riffs[s]), 0.18, 'square', 0.4, t);
    }
  }

  private renderLevel3Step(s: number, t: number): void {
    // Dark Synthwave / Tense urgency (D minor)
    if (s % 4 === 0) this.playPercussion('kick', t);
    if (s % 8 === 4) this.playPercussion('snare', t);
    // Double time hi-hats for clock ticking stress
    this.playPercussion('hihat', t);

    // Rolling 16th bass
    const dBass = [-31, -31, -19, -31, -31, -19, -27, -24];
    this.playTone(this.noteToFreq(dBass[s % 8]), 0.11, 'sawtooth', 0.5, t);

    // Dark tense synth chords and leads
    const tenseLead: { [step: number]: number } = {
      0: 5, 8: 4, 16: 1, 24: 0,
      32: 5, 40: 8, 48: 7, 56: 4, 60: 5
    };
    if (tenseLead[s] !== undefined) {
      this.playTone(this.noteToFreq(tenseLead[s]), 0.45, 'sawtooth', 0.45, t);
    }
  }

  private renderBossStep(s: number, t: number): void {
    // Fast aggressive battle rhythm
    if (s % 4 === 0 || s % 8 === 6) this.playPercussion('kick', t);
    if (s % 8 === 2 || s % 8 === 6) this.playPercussion('snare', t);
    this.playPercussion('hihat', t);

    // Aggressive driving bass
    const fastBass = [-24, -21, -24, -20, -24, -21, -17, -19];
    this.playTone(this.noteToFreq(fastBass[s % 8]), 0.1, 'sawtooth', 0.65, t);

    // Heroic/Intense battle leads
    const bossLead: { [step: number]: number } = {
      0: 0, 3: 0, 6: 3, 8: 5, 11: 7, 14: 10,
      16: 12, 19: 10, 22: 7, 24: 5, 27: 3, 30: 0,
      32: 12, 36: 15, 40: 17, 44: 15, 48: 12, 52: 10, 56: 7, 60: 3
    };
    if (bossLead[s] !== undefined) {
      this.playTone(this.noteToFreq(bossLead[s]), 0.22, 'square', 0.55, t);
    }
  }

  private renderVictoryStep(s: number, t: number): void {
    if (s < 32) {
      if (s % 4 === 0) this.playPercussion('kick', t);
      if (s % 8 === 4) this.playPercussion('snare', t);

      const fanfare: { [step: number]: number } = {
        0: 0, 4: 4, 8: 7, 12: 12, 16: 7, 20: 12, 24: 16
      };
      if (fanfare[s] !== undefined) {
        this.playTone(this.noteToFreq(fanfare[s]), 0.35, 'square', 0.5, t);
      }
    }
  }

  private renderGameOverStep(s: number, t: number): void {
    if (s < 16) {
      const sad: { [step: number]: number } = {
        0: 0, 4: -1, 8: -3, 12: -6
      };
      if (sad[s] !== undefined) {
        this.playTone(this.noteToFreq(sad[s]), 0.5, 'triangle', 0.6, t);
      }
    }
  }
}
