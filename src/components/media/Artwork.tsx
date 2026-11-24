import { PALETTES } from "@/lib/art";

interface ArtworkProps {
  seed: string;
  label: string;
  variant?: "thumb" | "poster";
  className?: string;
}

export function Artwork({ seed, label, variant = "thumb", className }: ArtworkProps) {
  const h = hashOf(seed);
  const p = PALETTES[h % PALETTES.length];
  const w = variant === "poster" ? 400 : 640;
  const h0 = variant === "poster" ? 600 : 360;

  return (
    <svg viewBox={`0 0 ${w} ${h0}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`g-${h % 97}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
      </defs>
      <rect width={w} height={h0} fill={`url(#g-${h % 97})`} />
      <circle cx={wDecco(h, 0)} cy={circleY(h, 0)} r={120} fill={p.glow} opacity={0.18} />
      <circle cx={wDecco(h, 1)} cy={circleY(h, 1)} r={70} fill={p.glow} opacity={0.14} />
      <text x={24} y={h0 - 24} fontSize={Math.max(16, Math.min(w, h0) * 0.05)} fill="rgba(255,255,255,0.65)" fontWeight="600" letterSpacing="0.08em">
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

function random(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashOf(s: string): number {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(x);
}

function wDecco(h: number, i: number): number {
  return 100 + ((h >>> (i * 3)) % 10) * 0.1 * 400;
}

function circleY(h: number, i: number): number {
  return 80 + ((h >>> (i * 3)) % 10) * 0.2 * 100;
}
