"use client";

import { useEffect, useId } from "react";
import type { ReactNode } from "react";

export function ModalShell({ children, onClose, titleId }: { children: ReactNode; onClose: () => void; titleId?: string }) {
  const fallbackTitleId = useId();
  const resolvedTitleId = titleId ?? fallbackTitleId;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        aria-labelledby={resolvedTitleId}
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-hero)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
