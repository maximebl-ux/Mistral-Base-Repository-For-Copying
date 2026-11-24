"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/store";
import { Button, Field, Input } from "@/components/ui/primitives";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Please fill in every field.");
      return;
    }

    setPending(true);
    // Simulated network latency keeps the loading state observable.
    window.setTimeout(() => {
      const result =
        mode === "login"
          ? login(email, password)
          : register(String(data.get("username") ?? "").trim(), email, password);
      setPending(false);
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    }, 250);
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl text-ink">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>
      <p className="mt-2 text-sm text-ink-dim">
        {mode === "login"
          ? "Welcome back. Sign in to pick up where you left off."
          : "Join Lumen to build a watchlist, like videos and publish to a channel."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "register" ? (
          <Field label="Username">
            <Input name="username" autoComplete="username" placeholder="your-handle" required />
          </Field>
        ) : null}
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Just a moment…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-faint">
        Prototype notice: accounts are stored in this browser only (localStorage). No server or
        production authentication is involved.
      </p>
    </div>
  );
}
