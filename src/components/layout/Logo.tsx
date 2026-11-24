import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="font-display text-xl font-semibold tracking-widest text-brand"
      aria-label="Lumen home"
    >
      LUMEN
    </Link>
  );
}
