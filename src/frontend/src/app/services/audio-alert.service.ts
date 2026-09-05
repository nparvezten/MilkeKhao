import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioAlertService {
  readonly isMuted = signal<boolean>(false);
  private audioCtx: AudioContext | null = null;

  constructor() {
    const saved = localStorage.getItem('milkekhao_kds_muted');
    if (saved !== null) {
      this.isMuted.set(saved === 'true');
    }
  }

  toggleMute(): void {
    const newVal = !this.isMuted();
    this.isMuted.set(newVal);
    localStorage.setItem('milkekhao_kds_muted', String(newVal));
  }

  /**
   * Synthesize a two-tone kitchen order chime (880Hz -> 1320Hz) via Web Audio API.
   * Works offline, zero external audio assets, zero latency.
   */
  playOrderChime(): void {
    if (this.isMuted()) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Tone 1: 880 Hz (A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 1320 Hz (E6 - High Attention Bell)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {
      // AudioContext blocked or unsupported in current environment
    }
  }
}
