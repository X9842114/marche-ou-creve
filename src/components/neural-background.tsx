"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type NeuralInstance = { destroy: () => void } | null;

declare global {
  interface Window {
    initNeuralNoise?: (
      canvas: HTMLCanvasElement,
      opts: { color: number[]; opacity: number; speed: number }
    ) => NeuralInstance;
  }
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<NeuralInstance>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !canvasRef.current || !window.initNeuralNoise) return;

    instanceRef.current = window.initNeuralNoise(canvasRef.current, {
      color: [0.55, 0.36, 0.94],
      opacity: 0.35,
      speed: 0.0008,
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [scriptReady]);

  return (
    <>
      <Script
        src="/neural-noise.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
      />
    </>
  );
}
