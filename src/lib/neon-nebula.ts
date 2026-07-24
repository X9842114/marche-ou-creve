import {
  NEON_NEBULA_CONFIG,
  type NeonNebulaConfig,
} from "@/lib/neon-nebula-config";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, v));
}

function hash2(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function luminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export class NeonNebulaEngine {
  private cfg: NeonNebulaConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private source: HTMLCanvasElement;
  private sourceCtx: CanvasRenderingContext2D;
  private ascii: HTMLCanvasElement;
  private asciiCtx: CanvasRenderingContext2D;
  private work: HTMLCanvasElement;
  private workCtx: CanvasRenderingContext2D;
  private grainTile: HTMLCanvasElement | null = null;
  private grainSeed = -1;
  private raf = 0;
  private startedAt = 0;
  private running = false;
  private cssW = 0;
  private cssH = 0;
  /** Internal render scale - lower = much faster */
  private scale = 0.32;
  private lastFrame = 0;
  /** Cap ~28fps - enough for ambient bg, frees main thread */
  private frameMs = 1000 / 28;
  private visible = true;

  constructor(
    canvas: HTMLCanvasElement,
    cfg: NeonNebulaConfig = NEON_NEBULA_CONFIG
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Canvas2D unavailable");
    this.ctx = ctx;
    this.cfg = cfg;

    this.source = document.createElement("canvas");
    this.ascii = document.createElement("canvas");
    this.work = document.createElement("canvas");
    this.sourceCtx = this.source.getContext("2d", {
      willReadFrequently: true,
    })!;
    this.asciiCtx = this.ascii.getContext("2d")!;
    this.workCtx = this.work.getContext("2d")!;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.resize();
    this.visible = document.visibilityState !== "hidden";

    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (!this.visible) return;
      if (now - this.lastFrame < this.frameMs) return;
      this.lastFrame = now;
      this.render(now);
    };
    this.raf = requestAnimationFrame(loop);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private onResize = () => {
    this.resize();
  };

  private onVisibility = () => {
    this.visible = document.visibilityState !== "hidden";
  };

  private resize() {
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    // Output canvas at 1x CSS - upscale from low-res buffer (cheaper than hi-dpr)
    this.canvas.width = this.cssW;
    this.canvas.height = this.cssH;
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    const w = Math.max(280, Math.floor(this.cssW * this.scale));
    const h = Math.max(200, Math.floor(this.cssH * this.scale));
    for (const c of [this.source, this.ascii, this.work]) {
      c.width = w;
      c.height = h;
    }
  }

  private render(now: number) {
    const t = (now - this.startedAt) / 1000;
    const w = this.source.width;
    const h = this.source.height;
    this.paintGradient(t, w, h);
    this.paintAscii(t, w, h);
    this.compose(t, w, h);
  }

  private paintGradient(t: number, w: number, h: number) {
    const g = this.cfg.gradientSource;
    const ctx = this.sourceCtx;

    ctx.fillStyle = "#03000A";
    ctx.fillRect(0, 0, w, h);

    const speed =
      (g.animated ? g.speed / 50 : 0) *
      (this.cfg.animSpeed.enabled ? this.cfg.animSpeed.intensity / 100 : 0);
    const motion = (g.motionAmount / 100) * 0.12;
    const dir = g.motionReverse ? -1 : 1;
    const phase = t * speed * dir;

    let cx = (g.centerX / 100) * w;
    let cy = (g.centerY / 100) * h;
    if (g.animated) {
      cx += Math.sin(phase * 0.7) * w * motion;
      cy += Math.cos(phase * 0.55) * h * motion;
    }

    const radius =
      Math.hypot(w, h) * 0.55 * (g.scale / 100) * (1 + g.softness / 80);
    const wave = g.wave / 100;
    const distort = g.distortion / 100;

    // 2 layers only (was 3)
    for (let layer = 0; layer < 2; layer++) {
      const wobble = Math.sin(phase + layer * 1.7) * wave;
      const dx = Math.cos(phase * 0.9 + layer) * distort * radius * 0.15;
      const dy = Math.sin(phase * 1.1 + layer * 0.6) * distort * radius * 0.15;
      const lx = cx + dx;
      const ly = cy + dy;
      const r = radius * (0.85 + layer * 0.25) * (1 + wobble * 0.15);

      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      const stops = g.colors;
      for (const stop of stops) {
        const p = Math.min(0.999, Math.max(0, stop.pos / 100));
        const [r0, g0, b0] = hexToRgb(stop.hex);
        const a = layer === 0 ? 1 : 0.4;
        grad.addColorStop(p, `rgba(${r0},${g0},${b0},${a})`);
      }
      ctx.globalCompositeOperation = layer === 0 ? "source-over" : "screen";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";

    if (g.animated) {
      const ox = cx + Math.cos(phase * 1.3) * w * 0.18;
      const oy = cy + Math.sin(phase * 0.9) * h * 0.16;
      const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 0.35);
      orb.addColorStop(0, "rgba(233,204,255,0.3)");
      orb.addColorStop(0.5, "rgba(138,43,226,0.15)");
      orb.addColorStop(1, "rgba(3,0,10,0)");
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private paintAscii(t: number, w: number, h: number) {
    const { cfg } = this;
    const ctx = this.asciiCtx;
    // Larger cells at low-res buffer ≈ visual cellSize 16 on full screen
    const cell = Math.max(10, Math.round(cfg.cellSize * 0.75));
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);

    // One getImageData per frame (biggest cost - keep buffer small via scale)
    const src = this.sourceCtx.getImageData(0, 0, w, h).data;

    ctx.clearRect(0, 0, w, h);
    // Soft backdrop without CSS filter blur (expensive)
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.source, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(3,0,10,0.4)";
    ctx.fillRect(0, 0, w, h);

    const animAmt =
      cfg.animated && cfg.animIntensity.enabled
        ? cfg.animIntensity.intensity / 100
        : 0;
    const animSpd =
      cfg.animated && cfg.animSpeed.enabled
        ? cfg.animSpeed.intensity / 100
        : 0;
    const bright = cfg.brightness;
    const contrast = cfg.contrast / 100;
    const sat = cfg.saturation / 100;
    const dens = cfg.density / 100;
    const phaseBase = t * (0.8 + animSpd * 1.4);

    ctx.globalCompositeOperation = "source-over";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Single-pixel sample at cell center (fast)
        const x0 = col * cell;
        const y0 = row * cell;
        const sx = Math.min(w - 1, x0 + (cell >> 1));
        const sy = Math.min(h - 1, y0 + (cell >> 1));
        const i = (sy * w + sx) * 4;
        let r = src[i];
        let g = src[i + 1];
        let b = src[i + 2];

        r = (r - 128) * contrast + 128 + bright;
        g = (g - 128) * contrast + 128 + bright;
        b = (b - 128) * contrast + 128 + bright;
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + (r - gray) * sat;
        g = gray + (g - gray) * sat;
        b = gray + (b - gray) * sat;
        r = clamp(r);
        g = clamp(g);
        b = clamp(b);

        let lum = luminance(r, g, b);
        if (cfg.invert) lum = 1 - lum;
        if (lum < 0.08 + dens * 0.2) continue;

        let ox = 0;
        let oy = 0;
        let scaleMul = 1;
        if (animAmt > 0 && cfg.animStyle === "wave") {
          ox =
            Math.sin(phaseBase + row * 0.35 + col * 0.12) *
            cell *
            0.2 *
            animAmt;
          oy =
            Math.cos(phaseBase * 0.9 + col * 0.28) * cell * 0.16 * animAmt;
          scaleMul = 1 + Math.sin(phaseBase + row * 0.2) * 0.15 * animAmt;
        }

        const cx = x0 + cell / 2 + ox;
        const cy = y0 + cell / 2 + oy;
        const size = (cell * 0.35 + lum * cell * 0.7) * scaleMul;
        const alpha = 0.3 + lum * 0.7;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        // Tint the white sprite via source-in trick: draw colored rect then star?
        // Faster: drawImage with globalComposite multiply via fill + destination-in
        // Simplest fast path: draw tinted via canvas filter is slow.
        // Use drawImage + globalAlpha + CSS won't tint.
        // Draw sprite then multiply color with destination-atop on a tiny region - too heavy.
        // Practical: fillStyle doesn't tint drawImage. Use colored stars via
        // temporary composite: draw star in white, then fill with color using source-in on subpath.
        // Cheapest good look: drawImage white star + light color glow as fillRect behind? 
        // Actually use `ctx.drawImage` after setting an offscreen? 
        // Best cheap tint: drawImage star, then globalCompositeOperation='source-atop' fill - needs save restore per cell = slow.
        // Use hue via drawing colored diamond/cross with 2 triangles instead of sprite for colored look:
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(hash2(col, row, 3) * Math.PI);
        ctx.scale(size / 28, size / 28);
        ctx.beginPath();
        // 4-point star path (8 verts) - still cheaper than getImageData
        for (let k = 0; k < 8; k++) {
          const rr = k % 2 === 0 ? 14 : 5;
          const a = (k * Math.PI) / 4 - Math.PI / 2;
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private compose(t: number, w: number, h: number) {
    const { cfg, workCtx: wctx, ctx } = this;
    wctx.globalCompositeOperation = "source-over";
    wctx.globalAlpha = 1;
    wctx.clearRect(0, 0, w, h);
    wctx.drawImage(this.ascii, 0, 0);

    // Soft bloom without canvas filter blur - cheap screen double
    const bloom = cfg.pfx.bloom;
    if (bloom.enabled && bloom.intensity > 0) {
      const amt = bloom.intensity / 100;
      wctx.globalCompositeOperation = "screen";
      wctx.globalAlpha = 0.2 * amt;
      wctx.drawImage(this.ascii, -1, -1, w + 2, h + 2);
      wctx.globalAlpha = 1;
      wctx.globalCompositeOperation = "source-over";
    }

    // Light scanlines (every 4px)
    const scan = cfg.pfx.scanLines;
    if (scan.enabled && scan.intensity > 0) {
      wctx.fillStyle = `rgba(0,0,0,${(scan.intensity / 100) * 0.22})`;
      for (let y = 0; y < h; y += 4) wctx.fillRect(0, y, w, 1);
    }

    // Sparse film grain tile (update ~4/s)
    const grain = cfg.pfx.filmGrain;
    if (grain.enabled && grain.intensity > 0) {
      const seed = Math.floor(t * 4);
      if (!this.grainTile || this.grainSeed !== seed) {
        this.grainSeed = seed;
        if (!this.grainTile) {
          this.grainTile = document.createElement("canvas");
          this.grainTile.width = 48;
          this.grainTile.height = 48;
        }
        const gctx = this.grainTile.getContext("2d")!;
        const img = gctx.createImageData(48, 48);
        for (let i = 0; i < img.data.length; i += 4) {
          const n = hash2(i, seed, 1) * 255;
          img.data[i] = n;
          img.data[i + 1] = n;
          img.data[i + 2] = n;
          img.data[i + 3] = 255;
        }
        gctx.putImageData(img, 0, 0);
      }
      const pattern = wctx.createPattern(this.grainTile, "repeat");
      if (pattern) {
        wctx.save();
        wctx.globalAlpha = (grain.intensity / 100) * 0.12;
        wctx.globalCompositeOperation = "overlay";
        wctx.fillStyle = pattern;
        wctx.fillRect(0, 0, w, h);
        wctx.restore();
      }
    }

    // Vignette
    const vig = cfg.pfx.vignette;
    if (vig.enabled && vig.intensity > 0) {
      const g = wctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.25,
        w / 2,
        h / 2,
        Math.hypot(w, h) * 0.55
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${(vig.intensity / 100) * 0.8})`);
      wctx.fillStyle = g;
      wctx.fillRect(0, 0, w, h);
    }

    // Skip pixelate / halftone / chromatic each frame - too costly for ambient bg
    // Present
    ctx.fillStyle = "#03000A";
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.work, 0, 0, this.cssW, this.cssH);
  }
}
