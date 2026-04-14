"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { requestJson } from "@/lib/api";
import { normalizeAccessToken } from "@/lib/auth-token";
import { AuthResponse, VerifyEmailRequest } from "@/lib/contracts";
import { persistToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { BrandLogo } from "@/components/brand-logo";

export function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link.");
      return;
    }

    try {
      const response = await requestJson<AuthResponse>("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationToken: token } as VerifyEmailRequest),
      });

      persistToken(normalizeAccessToken(response.accessToken));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Verification failed. The link may be expired or invalid.");
    }
  }, [token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [router, status]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <section className="w-full rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-hero)] sm:p-8 text-center">
          <BrandLogo className="text-4xl sm:text-5xl mb-6" />
          <div className={ui.textSecondary}>Verifying your email...</div>
        </section>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <section className="w-full rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-hero)] sm:p-8 text-center">
          <BrandLogo className="text-4xl sm:text-5xl mb-6" />
          <h1 className={`text-2xl font-semibold ${ui.textExpense} mb-2`}>Verification Failed</h1>
          <p className={ui.textSecondary}>{errorMessage}</p>
          <p className={`mt-4 text-sm ${ui.textSecondary}`}>
            Please try registering again or contact support.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="w-full rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-hero)] sm:p-8 text-center">
        <BrandLogo className="text-4xl sm:text-5xl mb-6" />
        <h1 className={`text-2xl font-semibold ${ui.textIncome} mb-2`}>Email Verified!</h1>
        <p className={ui.textSecondary}>Redirecting to your dashboard...</p>
      </section>
    </div>
  );
}
