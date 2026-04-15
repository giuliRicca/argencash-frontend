import Link from "next/link";

import { ui } from "@/lib/ui";

export function MissingSessionState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page-gradient)] px-6">
      <div className="fade-up-enter w-full max-w-xl rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 text-center shadow-[var(--shadow-panel)]">
        <h1 className={`text-3xl font-semibold ${ui.textPrimary}`}>Sign in required</h1>
        <Link className={`mt-6 inline-flex ${ui.buttonBase} ${ui.buttonSolidGold} px-5 py-3`} href="/" prefetch={false} replace>
          Back
        </Link>
      </div>
    </main>
  );
}
