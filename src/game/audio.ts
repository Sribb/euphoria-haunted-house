/**
 * Every sound is synthesised live with the Web Audio API, so the game ships no audio files and no
 * licensed music (the hackathon video cannot use copyrighted music). The room is mostly quiet: a low
 * drone, wind, and the clock. Dread rises near the ghost; silence is part of the design.
 */
export class Sound {
  private ctx?: AudioContext;
  private master!: GainNode;
  private droneGain!: GainNode;
  private dreadGain!: GainNode;
  private noise!: AudioBuffer;
  muted = false;

  /** Must run inside a user gesture (browsers block audio until then). */
  start() {
    if (this.ctx) return;
    const ctx = (this.ctx = new AudioContext());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // drone: two detuned low tones through a soft filter
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.05;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    for (const f of [55, 55.6, 82.4]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(lp);
      o.start();
    }
    lp.connect(this.droneGain).connect(this.master);

    // dread: a dissonant pair that fades in near the ghost
    this.dreadGain = ctx.createGain();
    this.dreadGain.gain.value = 0;
    for (const f of [233.1, 246.9]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(this.dreadGain);
      o.start();
    }
    this.dreadGain.connect(this.master);

    // wind: filtered noise with a slow sweep
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();
    const wg = ctx.createGain();
    wg.gain.value = 0.025;
    wind.connect(bp).connect(wg).connect(this.master);
    wind.start();

    // the clock ticks once a second
    setInterval(() => this.tick(), 1000);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  /** 0 = calm, 1 = right next to a restless ghost. */
  setDread(x: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.dreadGain.gain.setTargetAtTime(0.03 * x * x, now, 0.3);
    this.droneGain.gain.setTargetAtTime(0.05 + 0.05 * x, now, 0.3);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slideTo?: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private hiss(dur: number, freq: number, vol: number, when = 0, sweepTo?: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  tick() { this.hiss(0.04, 2400, 0.04); }
  step() { this.hiss(0.07, 180 + Math.random() * 60, 0.12); }
  blip() { this.tone(660, 0.06, "square", 0.04); }
  open() { this.hiss(0.35, 300, 0.08, 0, 900); this.tone(392, 0.25, "triangle", 0.05, 0.1); }
  ignite() {
    this.hiss(0.5, 400, 0.18, 0, 2400);
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.5, "triangle", 0.06, 0.15 + i * 0.07));
  }
  boo() { this.tone(180, 0.7, "sawtooth", 0.06, 0, 90); this.hiss(0.6, 700, 0.06, 0, 200); }
  /** One rising note per candle as the freed ghost's room brightens (step 0, 1, 2). */
  chime(step: number) { this.tone([784, 988, 1175][step % 3], 0.5, "triangle", 0.05); }
  encounter() {
    this.tone(110, 1.2, "sawtooth", 0.08, 0, 55);
    this.tone(116.5, 1.2, "sawtooth", 0.06);
    this.hiss(0.9, 1200, 0.1, 0, 150);
  }
  right() { [659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, "triangle", 0.07, i * 0.08)); }
  wrong() { this.tone(155, 0.6, "sawtooth", 0.09, 0, 70); this.tone(164, 0.6, "square", 0.04); }
  freed() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 1.6, "sine", 0.06, i * 0.12));
    this.hiss(1.5, 3000, 0.05, 0.2, 8000);
  }

  // ---------------------------------------------------------------- cutscenes

  private music?: { timer: number; bus: GainNode; next: number; step: number };

  /** A music-box lullaby in A minor (3/4), plucked through an echo. The house drone ducks under it. */
  movieStart() {
    const ctx = this.ctx;
    if (!ctx || this.music) return;
    const bus = ctx.createGain();
    bus.gain.value = 0.0001;
    bus.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    bus.connect(lp).connect(this.master);
    lp.connect(delay).connect(fb).connect(delay);
    delay.connect(this.master);
    this.droneGain.gain.setTargetAtTime(0.015, ctx.currentTime, 0.4);
    this.dreadGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    const N = { A3: 220, E3: 164.8, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880 };
    const tune = [N.E5, N.A4, N.C5, N.E5, N.D5, N.C5, N.B4, N.G4, N.B4, N.D5, N.C5, N.B4, N.A4, N.C5, N.E5, N.A5, N.G5, N.E5, N.F5, N.E5, N.D5, N.C5, N.B4, N.A4];
    const BEAT = 0.4;
    const pluck = (f: number, t: number, vol: number) => {
      for (const [mult, type, v] of [[1, "triangle", vol], [2, "sine", vol * 0.35]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 1.4);
      }
    };
    const m = (this.music = { timer: 0, bus, next: ctx.currentTime + 0.3, step: 0 });
    const schedule = () => {
      while (m.next < ctx.currentTime + 0.25) {
        const i = m.step % tune.length;
        pluck(tune[i], m.next, 0.05);
        if (i % 3 === 0) pluck(i % 6 === 0 ? N.A3 : N.E3, m.next, 0.035);
        m.next += BEAT;
        m.step++;
      }
    };
    schedule();
    m.timer = window.setInterval(schedule, 90);
  }

  movieStop() {
    const ctx = this.ctx, m = this.music;
    if (!ctx || !m) return;
    clearInterval(m.timer);
    m.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    setTimeout(() => m.bus.disconnect(), 1500);
    this.music = undefined;
    this.droneGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.6);
  }

  /** A soft page-turn as the scene changes. */
  beat() { this.hiss(0.25, 1800, 0.03, 0, 600); }

  /** A small sound for each thing that moves in a cutscene. */
  cue(kind: string) {
    switch (kind) {
      case "enter": case "slide": this.hiss(0.18, 900, 0.03, 0, 2200); break;
      case "stamp": this.tone(110, 0.18, "sine", 0.09, 0, 60); this.tone(784, 0.3, "triangle", 0.04, 0.05); break;
      case "count": [0, 0.09, 0.18, 0.27].forEach((d) => this.tone(1319, 0.06, "square", 0.015, d)); break;
      case "play": [1568, 2093].forEach((f, i) => this.tone(f, 0.25, "sine", 0.03, i * 0.07)); break;
      case "ghost": this.tone(330, 0.6, "sine", 0.04, 0, 250); break;
      default: break;
    }
  }
}
