"use client";

/**
 * Fond ambiance - 100 % statique (safe épilepsie).
 * Aucun GIF, flash, scanline animée, ni particule.
 */
export function CrtAtmosphere() {
  return (
    <div className="crt-atmosphere" aria-hidden>
      <div className="crt-atmosphere__still" />
      <div className="crt-atmosphere__vignette" />
    </div>
  );
}
