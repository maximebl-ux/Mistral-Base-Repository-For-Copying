"use client";

import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="page-pad flex min-h-[80vh] items-center justify-center pb-20 pt-28">
      <AuthForm mode="login" />
    </div>
  );
}
