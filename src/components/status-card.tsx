import type { ReactNode } from "react";

import { ui } from "@/lib/ui";

export function LoadingCard({ label }: { label: string }) {
  return <div className={`rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4 text-sm ${ui.textMuted}`}>{label}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}

export function EmptyState({ action, children }: { action?: ReactNode; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>
      {children}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
