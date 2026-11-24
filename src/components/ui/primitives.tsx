import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-[#171204] hover:bg-[#d9a24a] font-semibold",
  secondary: "bg-surface-2 text-ink hover:bg-surface-3",
  ghost: "bg-transparent text-ink-dim hover:bg-surface-2 hover:text-ink",
  danger: "bg-transparent text-danger hover:bg-danger/10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  ariaLabel?: string;
}

export function LinkButton({ href, children, variant = "primary", className = "", ariaLabel }: LinkButtonProps) {
  return (
    <Link href={href} aria-label={ariaLabel} className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded border border-hairline px-1.5 py-0.5 text-[11px] font-medium text-ink-dim ${className}`}>
      {children}
    </span>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none ${className}`}
      {...rest}
    />
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-hairline px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {body ? <p className="max-w-md text-sm text-ink-dim">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
