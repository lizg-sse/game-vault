"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * The fire under a streak.
 *
 * React owns the *state* — how hot the board should be, and when a pick just
 * landed. The burning itself is a particle system on a canvas, because a dozen
 * CSS keyframe elements can only ever loop the same flicker: they can't carry a
 * continuous intensity, they can't throw embers on a surge, and they can't
 * burn out. `intensity` is a target the engine eases toward, so the fire catches
 * over a second or so and smoulders out more slowly than it lit.
 */

const MAX_EMBERS = 150;
/** Ember art is pre-rendered at this many points along the cooling ramp. */
const EMBER_STEPS = 8;

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  seed: number;
};

/** Cheap 1-D value noise — keeps the flame bed off an obvious sine wave. */
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function noise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const smooth = f * f * (3 - 2 * f);
  return hash(i) * (1 - smooth) + hash(i + 1) * smooth;
}

/**
 * One soft teardrop, drawn once and stretched per flame. Cheaper by far than
 * building a gradient per tongue per frame, and the blur is what stops the
 * bed reading as a row of blobs.
 */
function buildFlame(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const x = c.getContext("2d");
  if (!x) return c;

  // Alpha has to hold most of the way up the sprite. Fade it out early and the
  // tongue collapses to a bright nub at the base once globalAlpha is applied.
  const g = x.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, "rgba(255,250,235,1)");
  g.addColorStop(0.1, "rgba(255,236,180,1)");
  g.addColorStop(0.28, "rgba(255,190,90,0.95)");
  g.addColorStop(0.5, "rgba(255,140,44,0.8)");
  g.addColorStop(0.72, "rgba(232,86,24,0.55)");
  g.addColorStop(0.88, "rgba(190,44,12,0.25)");
  g.addColorStop(1, "rgba(150,26,6,0)");

  x.filter = "blur(7px)";
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(64, 10);
  x.bezierCurveTo(94, 92, 122, 150, 122, 190);
  x.bezierCurveTo(122, 232, 96, 250, 64, 250);
  x.bezierCurveTo(32, 250, 6, 232, 6, 190);
  x.bezierCurveTo(6, 150, 34, 92, 64, 10);
  x.closePath();
  x.fill();
  return c;
}

/** White-hot down to a dying red, so an ember cools as it climbs. */
function buildEmbers(): HTMLCanvasElement[] {
  return Array.from({ length: EMBER_STEPS }, (_, i) => {
    const k = 1 - i / (EMBER_STEPS - 1);
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const x = c.getContext("2d");
    if (!x) return c;

    const green = Math.round(96 + 152 * k);
    const blue = Math.round(24 + 150 * k * k);
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(255,${Math.min(255, green + 40)},${Math.min(255, blue + 60)},1)`);
    g.addColorStop(0.28, `rgba(255,${green},${blue},0.8)`);
    g.addColorStop(1, "rgba(255,90,24,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return c;
  });
}

class Fire {
  private ctx: CanvasRenderingContext2D | null;
  private flameArt = buildFlame();
  private emberArt = buildEmbers();
  private embers: Ember[] = [];

  private w = 0;
  private h = 0;

  /** Eased actual heat; `target` is what React asked for. */
  private heat = 0;
  private target = 0;
  /** Surge envelope. A pick tops up `energy`, which releases slowly; `flare`
   *  chases it with a soft attack so the fire swells instead of snapping. */
  private energy = 0;
  private flare = 0;
  private spawn = 0;

  private t = 0;
  private last = 0;
  private raf = 0;
  private live = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.resize();
  }

  resize() {
    const { canvas, ctx } = this;
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    // Fire is soft-edged, so a 2× ceiling costs nothing visible on a 3× screen.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = w;
    this.h = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setTarget(value: number) {
    this.target = Math.max(0, Math.min(1, value));
    if (this.target > 0) this.play();
  }

  /** A pick landed: the fire gulps air. Scaled by how hot it already is, so a
   *  cold board stays cold and the first flame doesn't arrive as a bang. Only
   *  the reservoir moves here — the swell itself is shaped in `frame`. */
  burst() {
    this.energy = Math.min(1.2, this.energy + 0.5 + this.heat * 0.6);
    // A few embers immediately for the kick; the raised flare spawns the rest
    // over the next second, which is what keeps it from reading as a pop.
    const count = Math.round(this.heat * 8);
    for (let i = 0; i < count; i++) this.spawnEmber(1.5);
    if (this.heat > 0.01) this.play();
  }

  play() {
    if (this.live) return;
    this.live = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  pause() {
    this.live = false;
    cancelAnimationFrame(this.raf);
  }

  /** Resumed from a hidden tab — only if there's still something to burn. */
  resume() {
    if (this.target > 0 || this.embers.length) this.play();
  }

  destroy() {
    this.pause();
    this.embers = [];
    this.energy = 0;
    this.flare = 0;
  }

  private frame = (now: number) => {
    const ctx = this.ctx;
    if (!ctx) return;

    // Clamped so a backgrounded tab doesn't resume with one enormous step.
    const dt = Math.min(48, now - this.last) / 16.6667;
    this.last = now;
    this.t += dt * 16.6667;

    // Catching is quicker than going out — a dead streak should smoulder.
    const rate = this.target > this.heat ? 0.05 : 0.018;
    this.heat += (this.target - this.heat) * Math.min(1, rate * dt);

    // Release ~765ms half-life, attack ~185ms. Together the swell runs about
    // as long as the card reveal it answers, and never arrives as a jolt.
    this.energy *= Math.pow(0.985, dt);
    this.flare += (this.energy - this.flare) * Math.min(1, 0.09 * dt);

    const lit = Math.min(1.18, this.heat + this.flare * 0.45);

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";
    if (lit > 0.005) {
      this.drawGlow(lit);
      this.drawFlames(lit);
    }
    this.stepEmbers(dt, lit);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // Burnt out: stop the loop rather than idle at 60fps over a blank canvas.
    // `flare` is in the test too, so we never cut while a surge is still lit.
    if (this.target <= 0.0005 && this.heat < 0.005 && this.flare < 0.01 && !this.embers.length) {
      ctx.clearRect(0, 0, this.w, this.h);
      this.live = false;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private drawGlow(lit: number) {
    const { ctx, w, h } = this;
    if (!ctx) return;
    const height = Math.min(h, 120 + 320 * lit);
    const g = ctx.createLinearGradient(0, h, 0, h - height);
    g.addColorStop(0, `rgba(255,122,30,${0.2 * lit})`);
    g.addColorStop(0.35, `rgba(255,92,20,${0.09 * lit})`);
    g.addColorStop(1, "rgba(255,80,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, h - height, w, height);
  }

  /** A dense bed along the floor, then sparser tall licks over the top of it.
   *  Under additive blending the overlap between the two is what reads as fire
   *  — one evenly spaced row only ever looks like a row. */
  private drawFlames(lit: number) {
    this.drawBand(lit, 30, 1, 0.55, 0.5, 0);
    this.drawBand(lit, 88, 1.45, 0.3, 0.34, 41.7);
  }

  private drawBand(
    lit: number,
    spacing: number,
    scale: number,
    alphaBase: number,
    alphaVar: number,
    seed: number,
  ) {
    const { ctx, w, h, t } = this;
    if (!ctx) return;
    const cols = Math.max(6, Math.round(w / spacing));
    const step = w / cols;

    for (let i = 0; i < cols; i++) {
      // Three noise reads at different rates: a slow sway, a mid-rate height,
      // and a fast flicker. Together they never visibly repeat.
      const sway = noise(seed + i * 2.7 + t * 0.0018);
      const tall = noise(seed + i * 5.3 + t * 0.0037);
      const flick = noise(seed + i * 11.7 + t * 0.009);

      const alpha = Math.min(0.95, lit * (alphaBase + tall * alphaVar));
      if (alpha < 0.02) continue;

      // A fixed per-column offset on top of the drifting sway: without it the
      // tongues sit on an even grid and the eye reads the rhythm immediately.
      const jitter = hash(seed + i * 7.7) - 0.5;
      const bw = step * (1.5 + sway * 1.5);
      // Super-linear in `lit`, so a streak of 12 reads hotter than a streak of
      // 6 — but capped against the viewport, since the fire is meant to line
      // the floor, not climb the page. The cap also keeps a short landscape
      // phone from filling with flame.
      const bh = Math.min(
        h * 0.62,
        (18 + 165 * Math.pow(lit, 1.3)) * scale * (0.42 + tall) * (0.85 + flick * 0.3),
      );
      const x = (i + 0.5) * step + (jitter + (sway - 0.5) * 0.8) * step * 1.15;

      ctx.globalAlpha = alpha;
      ctx.drawImage(this.flameArt, x - bw / 2, h - bh, bw, bh);
    }
    ctx.globalAlpha = 1;
  }

  private spawnEmber(boost = 1) {
    if (this.embers.length >= MAX_EMBERS) return;
    this.embers.push({
      x: Math.random() * this.w,
      y: this.h - Math.random() * 26,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.8 + Math.random() * 1.8) * boost,
      age: 0,
      life: 1000 + Math.random() * 1900,
      r: 1 + Math.random() * 2.1,
      seed: Math.random() * 1000,
    });
  }

  private stepEmbers(dt: number, lit: number) {
    const { ctx, t } = this;
    if (!ctx) return;

    this.spawn += (lit * 1.7 + this.flare * 3.2) * dt;
    while (this.spawn >= 1) {
      this.spawn -= 1;
      this.spawnEmber();
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.age += dt * 16.6667;
      const k = 1 - e.age / e.life;
      if (k <= 0 || e.y < -30) {
        this.embers.splice(i, 1);
        continue;
      }

      e.vy -= 0.008 * dt; // buoyancy
      e.vy *= Math.pow(0.995, dt);
      e.vx += Math.sin(t * 0.0012 + e.seed) * 0.03 * dt; // wander on a draught
      e.vx *= Math.pow(0.987, dt);
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      const art = this.emberArt[Math.min(EMBER_STEPS - 1, Math.floor((1 - k) * EMBER_STEPS))];
      const size = e.r * (0.5 + k * 0.7) * 7;
      ctx.globalAlpha = Math.min(1, k * 2) * 0.85;
      ctx.drawImage(art, e.x - size / 2, e.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export function StreakFire({ intensity, surge }: { intensity: number; surge: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<Fire | null>(null);
  const still = usePrefersReducedMotion();

  // Engine lifetime. Declared first so it exists before the prop effects below.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (still || !canvas) return;

    const fire = new Fire(canvas);
    fireRef.current = fire;

    const observer = new ResizeObserver(() => fire.resize());
    observer.observe(canvas);

    const onVisibility = () => (document.hidden ? fire.pause() : fire.resume());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      fire.destroy();
      fireRef.current = null;
    };
  }, [still]);

  useEffect(() => {
    fireRef.current?.setTarget(intensity);
  }, [intensity, still]);

  useEffect(() => {
    if (surge > 0) fireRef.current?.burst();
  }, [surge, still]);

  if (still) {
    return <div aria-hidden="true" className="hl-fire hl-fire--still" />;
  }

  return <canvas ref={canvasRef} aria-hidden="true" className="hl-fire" />;
}
