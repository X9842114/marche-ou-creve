"use client";

import { useEffect, useRef } from "react";

type Syringe = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  phase: number;
  depth: number;
  el: HTMLDivElement;
};

const COUNT = 7;
const IMG = "/wandering-syringe.png";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createSyringe(layer: HTMLDivElement, vw: number, vh: number): Syringe {
  const depth = rand(0.4, 1);
  const size = Math.round(52 + depth * 70);
  const el = document.createElement("div");
  el.className = "wandering-syringe";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.opacity = String(0.22 + depth * 0.38);

  const img = document.createElement("img");
  img.src = IMG;
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.width = size;
  img.height = size;
  el.appendChild(img);
  layer.appendChild(el);

  const speed = 0.1 + depth * 0.28;
  const angle = rand(0, Math.PI * 2);

  return {
    x: rand(-size, vw),
    y: rand(-size, vh),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rot: rand(-40, 40),
    vRot: rand(-0.035, 0.035),
    size,
    phase: rand(0, Math.PI * 2),
    depth,
    el,
  };
}

export function WanderingSyringe() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const syringes: Syringe[] = [];
    for (let i = 0; i < COUNT; i++) {
      syringes.push(createSyringe(layer, vw, vh));
    }

    if (reduceMotion) {
      for (const s of syringes) {
        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      }
      return () => {
        layer.replaceChildren();
      };
    }

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const stepMs = 1000 / 30; // 30fps updates - smooth enough, half the style work

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.visibilityState === "hidden") return;
      acc += now - last;
      last = now;
      if (acc < stepMs) return;
      const dt = Math.min(2.5, acc / 16.67);
      acc = 0;
      const t = now * 0.001;

      for (const s of syringes) {
        s.vx += Math.sin(t * 0.18 + s.phase) * 0.01 * s.depth;
        s.vy += Math.cos(t * 0.15 + s.phase * 1.3) * 0.01 * s.depth;

        const maxSpeed = 0.18 + s.depth * 0.45;
        const spd = Math.hypot(s.vx, s.vy) || 0.001;
        if (spd > maxSpeed) {
          s.vx = (s.vx / spd) * maxSpeed;
          s.vy = (s.vy / spd) * maxSpeed;
        }

        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vRot * dt;

        const m = s.size * 0.6;
        if (s.x < -m) s.x = vw + m * 0.2;
        if (s.x > vw + m) s.x = -m * 0.2;
        if (s.y < -m) s.y = vh + m * 0.2;
        if (s.y > vh + m) s.y = -m * 0.2;

        const bob =
          Math.sin(t * (0.5 + s.depth * 0.35) + s.phase) * (3 + s.depth * 5);
        const wobble = Math.sin(t * 0.32 + s.phase) * (2 + s.depth * 4);
        s.el.style.transform = `translate3d(${s.x}px, ${s.y + bob}px, 0) rotate(${s.rot + wobble}deg)`;
      }
    };

    raf = requestAnimationFrame(tick);

    const onResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      layer.replaceChildren();
    };
  }, []);

  return <div ref={layerRef} aria-hidden className="wandering-syringe-layer" />;
}
