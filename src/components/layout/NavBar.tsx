"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/library", label: "Library" },
  { href: "/search", label: "Search" },
];

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-profile-menu]")) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/80 to-transparent">
      <div className="page-pad flex h-16 items-center gap-6">
        <Link href="/" className="font-display text-xl font-bold tracking-[0.3em] text-brand">
          LUMEN
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${isActive(link.href) ? "font-semibold text-ink" : "text-ink-dim hover:text-ink"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden sm:block">
          <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            aria-label="Search titles"
            className="w-48 rounded-md border border-hairline bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </form>

        {user ? (
          <div className="relative" data-profile-menu>
            <button onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} className="rounded-full">
              <Avatar profile={user} size={34} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-hairline bg-surface-1 p-2 shadow-2xl">
                <p className="truncate px-2 pb-1 text-sm font-semibold text-ink">{user.username}</p>
                <Link href="/profile" className="block rounded px-2 py-1.5 text-sm text-ink-dim hover:text-ink">Profile</Link>
                <Link href="/library" className="block rounded px-2 py-1.5 text-sm text-ink-dim hover:text-ink">My Library</Link>
                <Link href="/studio" className="block rounded px-2 py-1.5 text-sm text-ink-dim hover:text-ink">Creator Studio</Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="block rounded px-2 py-1.5 text-sm text-ink-dim hover:text-ink">Admin</Link>
                )}
                <button onClick={() => { logout(); router.push("/"); }} className="mt-1 w-full rounded px-2 py-1.5 text-left text-sm text-ink-dim hover:text-ink">
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-dim hover:text-ink">Sign in</Link>
            <Button onClick={() => router.push("/register")} className="px-3 py-1.5">Get started</Button>
          </div>
        )}
      </div>
    </header>
  );
}
