"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ui } from "@/lib/ui";

const redirectDelayMs = 1500;

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.replace("/login");
    }, redirectDelayMs);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page-gradient)] px-6">
      <div className="fade-up-enter w-full max-w-xl rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 text-center shadow-[var(--shadow-panel)]">
        <h1 className={`text-3xl font-semibold ${ui.textPrimary}`}>Session expired</h1>
        <p className={`mt-3 text-sm ${ui.textMuted}`}>You are not authorized anymore. Redirecting to sign in...</p>
        <Link className={`mt-6 inline-flex ${ui.buttonBase} ${ui.buttonSolidGold} px-5 py-3`} href="/login" prefetch={false} replace>
          Sign in now
        </Link>
      </div>
    </main>
  );
}
