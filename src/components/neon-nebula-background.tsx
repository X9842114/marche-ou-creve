"use client";

import { useEffect, useRef } from "react";
import { NeonNebulaEngine } from "@/lib/neon-nebula";

export function NeonNebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = new NeonNebulaEngine(canvas);

    if (reduce) {
      // Single static frame
      engine.start();
      const id = window.setTimeout(() => engine.stop(), 80);
      return () => {
        window.clearTimeout(id);
        engine.stop();
      };
    }

    engine.start();
    return () => engine.stop();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
