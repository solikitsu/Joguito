import type { Settings } from './types';

export type Sound = 'swing' | 'heavySwing' | 'hit' | 'heavyHit' | 'block' | 'parry' | 'clash' | 'dodge' | 'round' | 'ui';

export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambience: GainNode | null = null;
  private drones: OscillatorNode[] = [];
  private settings: Settings;

  constructor(settings: Settings) { this.settings = settings; }

  unlock() {
    if (!this.context) {
      try {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.settings.volume / 100 * 0.5;
        this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.ambience = this.context.createGain();
        this.ambience.gain.value = this.settings.music ? 0.023 : 0;
        this.ambience.connect(this.master);
        for (const frequency of [55, 82.41, 110.16]) {
          const drone = this.context.createOscillator();
          drone.type = 'sine'; drone.frequency.value = frequency;
          drone.connect(this.ambience); drone.start(); this.drones.push(drone);
        }
        this.setSettings(this.settings);
      } catch { return; }
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
  }

  setSettings(settings: Settings) {
    this.settings = settings;
    if (this.master && this.context) this.master.gain.setTargetAtTime(settings.volume / 100 * 0.5, this.context.currentTime, 0.08);
    if (this.ambience && this.context) this.ambience.gain.setTargetAtTime(settings.music ? 0.023 : 0, this.context.currentTime, 0.4);
  }

  play(sound: Sound) {
    const ctx = this.context, master = this.master;
    if (!ctx || !master || this.settings.volume === 0 || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (sound === 'swing' || sound === 'heavySwing' || sound === 'dodge' || sound === 'hit' || sound === 'heavyHit') {
      if (!this.noise) return;
      const source = ctx.createBufferSource(); source.buffer = this.noise;
      const filter = ctx.createBiquadFilter(); filter.type = sound.includes('Hit') || sound === 'hit' ? 'lowpass' : 'bandpass';
      filter.frequency.value = sound === 'heavyHit' ? 420 : sound === 'hit' ? 700 : sound === 'heavySwing' ? 650 : 1400;
      filter.Q.value = 0.8;
      const gain = ctx.createGain();
      const duration = sound === 'heavySwing' ? 0.22 : sound === 'heavyHit' ? 0.19 : 0.11;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(sound === 'heavyHit' ? 0.9 : 0.32, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.start(now, Math.random() * 0.4); source.stop(now + duration);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      if (sound === 'hit' || sound === 'heavyHit') this.tone(95, 0.14, 0.32, 'sine');
      return;
    }
    if (sound === 'parry') {
      this.tone(1760, 0.38, 0.24, 'triangle'); this.tone(2637, 0.24, 0.12, 'sine'); this.tone(880, 0.17, 0.13, 'triangle');
    } else if (sound === 'block') {
      this.tone(530, 0.13, 0.21, 'triangle'); this.tone(970, 0.08, 0.09, 'square');
    } else if (sound === 'clash') {
      this.tone(1180, 0.23, 0.2, 'triangle'); this.tone(1930, 0.18, 0.1, 'sine');
    } else if (sound === 'round') {
      this.tone(220, 0.75, 0.24, 'sine'); this.tone(329.63, 0.55, 0.13, 'sine');
    } else this.tone(660, 0.055, 0.07, 'sine');
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType) {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.78, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain); gain.connect(this.master!);
    oscillator.start(); oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  suspend() { if (this.context?.state === 'running') void this.context.suspend().catch(() => {}); }
  destroy() {
    this.drones.forEach(drone => { try { drone.stop(); } catch { /* Already stopped. */ } });
    this.drones.length = 0;
    if (this.context) void this.context.close().catch(() => {});
  }
}