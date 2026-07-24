/** Neon Nebula ASCII config - 21st.dev community recipe */

export type GradientColorStop = {
  id: string;
  name: string;
  hex: string;
  pos: number;
};

export type PfxKey =
  | "vignette"
  | "scanLines"
  | "chromatic"
  | "bloom"
  | "filmGrain"
  | "glitch"
  | "pixelate"
  | "halftone"
  | "filmDust";

export type NeonNebulaConfig = {
  renderMode: string;
  bgMode: string;
  bgBlur: number;
  bgOpacity: number;
  cellSize: number;
  coverage: number;
  invert: boolean;
  styleBlend: GlobalCompositeOperation;
  charSet: string;
  customChars: string;
  brightness: number;
  contrast: number;
  edgeEmphasis: number;
  density: number;
  toneCurve: { x: number; y: number }[];
  tint: string;
  tintOpacity: number;
  overlayBlend: GlobalCompositeOperation;
  saturation: number;
  grayscale: number;
  blurType: string;
  blurAmount: number;
  animated: boolean;
  animStyle: string;
  animSpeed: { enabled: boolean; intensity: number };
  animIntensity: { enabled: boolean; intensity: number };
  pfx: Record<PfxKey, { enabled: boolean; intensity: number }>;
  lights: { enabled: boolean; points: unknown[] };
  mask: { enabled: boolean; invert: boolean; dataUrl: string | null };
  gradientSource: {
    mode: string;
    colors: GradientColorStop[];
    angle: number;
    centerX: number;
    centerY: number;
    scale: number;
    softness: number;
    wave: number;
    distortion: number;
    grain: number;
    vignette: number;
    animated: boolean;
    speed: number;
    motionAmount: number;
    motionReverse: boolean;
    seed: number;
    backdrop: string;
  };
};

export const NEON_NEBULA_CONFIG: NeonNebulaConfig = {
  renderMode: "stars",
  bgMode: "solid",
  bgBlur: 12,
  bgOpacity: 90,
  cellSize: 16,
  coverage: 100,
  invert: false,
  styleBlend: "source-over",
  charSet: "standard",
  customChars: "",
  brightness: 12,
  contrast: 115,
  edgeEmphasis: 0,
  density: 0,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  tint: "#3ca6ff",
  tintOpacity: 0,
  overlayBlend: "multiply",
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  blurAmount: 35,
  animated: true,
  animStyle: "wave",
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 60 },
  pfx: {
    vignette: { enabled: true, intensity: 38 },
    scanLines: { enabled: true, intensity: 40 },
    chromatic: { enabled: false, intensity: 15 },
    bloom: { enabled: true, intensity: 25 },
    filmGrain: { enabled: true, intensity: 30 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: true, intensity: 15 },
    halftone: { enabled: true, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 },
  },
  lights: { enabled: false, points: [] },
  mask: { enabled: false, invert: false, dataUrl: null },
  gradientSource: {
    mode: "radial",
    colors: [
      { id: "c42_1962", name: "Mauve", hex: "#E9CCFF", pos: 0 },
      { id: "c43_37723", name: "Violet", hex: "#8A2BE2", pos: 33 },
      { id: "c44_73484", name: "Midnight", hex: "#240046", pos: 67 },
      { id: "c45_9245", name: "Ink", hex: "#03000A", pos: 100 },
    ],
    angle: 90,
    centerX: 46,
    centerY: 52,
    scale: 88,
    softness: 26,
    wave: 12,
    distortion: 28,
    grain: 0,
    vignette: 0,
    animated: true,
    speed: 50,
    motionAmount: 86,
    motionReverse: false,
    seed: 1,
    backdrop: "#EAF4FC",
  },
};
