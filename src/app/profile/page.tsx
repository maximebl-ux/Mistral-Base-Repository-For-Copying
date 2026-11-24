"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Field, Input, Textarea, Badge } from "@/components/ui/primitives";
import { useStore } from "@/stores/store";
import { PALETTES } from "@/lib/art";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const router = useRouter();
  const { user, mounted, updateProfile, logout } = useStore();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [palette, setPalette] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setBio(user.bio);
      setPalette(user.avatarPalette);
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="page-pad pt-28">
        <p className="text-sm text-ink-dim">Loading profile…</p>
      </div>
    );
  }

  const dirty = username !== user.username || bio !== user.bio || palette !== user.avatarPalette;

  function save() {
    if (!username.trim()) return;
    updateProfile({ username: username.trim(), bio, avatarPalette: palette });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-pad mx-auto max-w-3xl pb-20 pt-28">
      <div className="flex items-center gap-4">
        <Avatar profile={{ username, avatarPalette: palette }} size={72} />
        <div>
          <h1 className="font-display text-2xl text-ink">{user.username}</h1>
          <p className="text-sm text-ink-dim">{user.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge className="capitalize">{user.role}</Badge>
            <span className="text-xs text-ink-faint">Member since {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5 rounded-lg border border-hairline bg-surface-1/60 p-5">
        <Field label="Username">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} />
        </Field>
        <Field label="Bio">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="A line or two about you."
          />
        </Field>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-dim">Avatar colour</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PALETTES.map((p, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Palette ${i + 1}`}
                aria-pressed={palette === i}
                onClick={() => setPalette(i)}
                className={`h-8 w-8 rounded-full transition ${palette === i ? "ring-2 ring-brand ring-offset-2 ring-offset-[#0b0d12]" : "opacity-70 hover:opacity-100"}`}
                style={{ background: `linear-gradient(135deg, ${p.glow}, ${p.from})` }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={!dirty || !username.trim()}>
            Save changes
          </Button>
          {saved && <span className="text-sm text-brand">Saved</span>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-4 py-2 text-sm text-ink transition hover:bg-surface-3"
        >
          My Library
        </Link>
        {user.role !== "viewer" && (
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-4 py-2 text-sm text-ink transition hover:bg-surface-3"
          >
            Creator Studio
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-4 py-2 text-sm text-ink transition hover:bg-surface-3"
          >
            Admin console
          </Link>
        )}
        <Button
          variant="danger"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        Prototype notice: profile data lives in this browser's localStorage only. Production
        authentication and account storage are intentionally not connected.
      </p>
    </div>
  );
}
