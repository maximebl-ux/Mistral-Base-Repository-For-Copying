import type { UserProfile } from "@/types";
import { PALETTES } from "@/lib/art";

export function Avatar({
  profile,
  size = 32,
}: {
  profile: Pick<UserProfile, "username" | "avatarPalette">;
  size?: number;
}) {
  const p = PALETTES[profile.avatarPalette % PALETTES.length];
  const initial = profile.username.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${p.glow}, ${p.from})`,
        fontSize: size * 0.42,
        color: "#0b0d12",
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
