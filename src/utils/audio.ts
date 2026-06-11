/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class ReadingRoomAmbiance {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private droneGains: GainNode[] = [];
  private fireInterval: any = null;
  private isPlaying: boolean = false;
  private targetVolume: number = 0.05; // Default low, safe volume (5%)

  async start() {
    if (this.isPlaying) return;
    try {
      // Create audio context safely
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API is not supported in this browser.");
        return;
      }
      this.ctx = new AudioCtx();
      // Resume AudioContext if suspended (browsers require user gesture to start audio)
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isPlaying = true;

      // Master Gain - keep it very subtle and low-volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Cozy Rain / Wind Hum (Brown Noise)
      const bufferSize = Math.max(2 * this.ctx.sampleRate, 44100);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise approximation formula
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensation factor for attenuation
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(280, this.ctx.currentTime); // muffled cozy sound

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // low wind and rain rumble

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      // 2. Warm Pad / Drone (Cozy fireplace organ/chords)
      // We will play 3 soft cozy notes: A2 (110.0Hz), E3 (164.81Hz), and A3 (220.0Hz)
      const notes = [110.00, 164.81, 220.00]; 
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        // first oscillator is a pure sine wave, others can be triangles for warmer harmonics
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const oscFilter = this.ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(140, this.ctx.currentTime); // Cut high frequencies

        const oscGain = this.ctx.createGain();
        const baseVol = idx === 0 ? 0.05 : 0.03;
        oscGain.gain.setValueAtTime(baseVol, this.ctx.currentTime);

        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(this.masterGain!);
        osc.start();

        this.droneOscs.push(osc);
        this.droneGains.push(oscGain);

        // Slow organic breathing/swelling for each drone note
        let direction = 1;
        let currentVol = baseVol;
        const intervalId = setInterval(() => {
          if (!this.ctx || !this.isPlaying || !oscGain) return;
          currentVol += direction * 0.003;
          if (currentVol > baseVol * 1.6) direction = -1;
          if (currentVol < baseVol * 0.5) direction = 1;
          try {
            oscGain.gain.linearRampToValueAtTime(currentVol, this.ctx.currentTime + 1.8);
          } catch (e) {
            // Safe fallback
          }
        }, 1500 + idx * 400);

        // Store interval on the context object so we do not leak memory
        (osc as any).modInterval = intervalId;
      });

      // 3. Fire Crackles & Pages Turning (Tiny dynamic sparks)
      this.fireInterval = setInterval(() => {
        if (!this.ctx || !this.isPlaying || Math.random() > 0.45) return;
        try {
          // Play a tiny, sharp popping spark
          const pop = this.ctx.createOscillator();
          pop.type = 'sine';
          pop.frequency.setValueAtTime(600 + Math.random() * 1000, this.ctx.currentTime);

          const popGain = this.ctx.createGain();
          popGain.gain.setValueAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015 + Math.random() * 0.02);

          const popFilter = this.ctx.createBiquadFilter();
          popFilter.type = 'bandpass';
          popFilter.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);

          pop.connect(popFilter);
          popFilter.connect(popGain);
          popGain.connect(this.masterGain!);

          pop.start();
          pop.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
          // ignore
        }
      }, 280);

    } catch (err) {
      console.error("Failed to start reading room soundscape:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.fireInterval) {
      clearInterval(this.fireInterval);
      this.fireInterval = null;
    }
    try {
      if (this.noiseNode) {
        try { this.noiseNode.stop(); } catch (e) {}
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.droneOscs.forEach(osc => {
        if ((osc as any).modInterval) {
          clearInterval((osc as any).modInterval);
        }
        try { osc.stop(); } catch (e) {}
        osc.disconnect();
      });
      this.droneOscs = [];
      this.droneGains.forEach(gain => {
        try { gain.disconnect(); } catch (e) {}
      });
      this.droneGains = [];
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }
      if (this.ctx) {
        try { this.ctx.close(); } catch (e) {}
        this.ctx = null;
      }
    } catch (e) {
      console.error("Error stopping reading room soundscape:", e);
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export const ambientSound = new ReadingRoomAmbiance();
