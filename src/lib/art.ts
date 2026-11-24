export interface Palette {
  from: string;
  to: string;
  glow: string;
}

export const PALETTE_COUNT = 12;

export const PALETTES: Palette[] = [
  { from: "#1b2b4a", to: "#0d1524", glow: "#5d87d1" },
  { from: "#3d1f3f", to: "#160a18", glow: "#c46ba8" },
  { from: "#153f38", to: "#0a1a16", glow: "#54c9a8" },
  { from: "#453018", to: "#1c1208", glow: "#e6b45c" },
  { from: "#401d1d", to: "#180a0a", glow: "#d97171" },
  { from: "#25265a", to: "#0e0f28", glow: "#8b8ef0" },
  { from: "#1c3d52", to: "#0b1720", glow: "#5fb7dd" },
  { from: "#37521d", to: "#131d09", glow: "#9fce62" },
  { from: "#4a2a14", to: "#1c0f06", glow: "#e08b4a" },
  { from: "#375252", to: "#121d1d", glow: "#6ecfc4" },
  { from: "#3b2148", to: "#160a1c", glow: "#b07ae0" },
  { from: "#2c3134", to: "#101214", glow: "#9fb3bd" },
];

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function paletteFor(seed: string): Palette {
  return PALETTES[hashString(seed) % PALETTE_COUNT];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ArtGeometry {
  cx1: number;
  cy1: number;
  r1: number;
  cx2: number;
  cy2: number;
  r2: number;
  ex: number;
  ey: number;
  er: number;
  ix: number;
  iy: number;
  ir: number;
}

export function geometryFor(seed: string, w: number, h: number): ArtGeometry {
  const rng = mulberry32(hashString(seed));
  return {
    cx1: w * (0.15 + rng() * 0.4),
    cy1: h * (0.1 + rng() * 0.35),
    r1: h * (0.55 + rng() * 0.35),
    cx2: w * (0.5 + rng() * 0.45),
    cy2: h * (0.45 + rng() * 0.5),
    r2: h * (0.28 + rng() * 0.3),
    ex: w * (0.2 + rng() * 0.6),
    ey: h * (0.72 + rng() * 0.2),
    er: w * (0.32 + rng() * 0.2),
    ix: w * (0.55 + rng() * 0.4),
    iy: h * (0.1 + rng() * 0.3),
    ir: w * (0.06 + rng() * 0.05),
  };
}

export function artId(prefix: string, id: string): string {
  return `art-${prefix}-${id.replace(/[^a-z0-9-]/gi, "")}`;
}
