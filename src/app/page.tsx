"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ui } from "@/lib/ui";
import { useStoredToken } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const accessToken = useStoredToken();

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);

  if (accessToken) {
    return null;
  }

  return (
    <main className={`${ui.page} relative pt-10 sm:pt-12 lg:pt-14`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="fade-up-enter rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-panel)] sm:p-10">
          <div className="fade-up-enter-delay-1 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Portfolio Case Study</p>
              <BrandLogo className="mt-2 text-5xl sm:text-6xl" />
            </div>
            <div className="rounded-2xl border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Project Focus</p>
              <p className="mt-1 text-sm font-medium text-[var(--accent-gold-text)]">Multi-currency finance operations</p>
            </div>
          </div>

          <div className="fade-up-enter-delay-2 mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl ${ui.textPrimary}`}>
                Built to manage USD/ARS volatility with transaction-grade visibility.
              </h1>
              <p className={`mt-4 max-w-2xl text-base ${ui.textSecondary}`}>
                ArgenCash is a full-stack personal finance workspace where users create accounts, record income and expenses, move funds between accounts, monitor portfolio totals, and track exchange-rate impact in real time.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} px-6 py-3`} href="/login" prefetch={false}>
                  Log in
                </Link>
                <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonNeutral} px-6 py-3`} href="/register" prefetch={false}>
                  Register
                </Link>
              </div>
            </div>

            <aside className="rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Production Surface</p>
              <dl className="mt-4 grid gap-4">
                {projectMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{metric.label}</dt>
                    <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section className="fade-up-enter-delay-1 grid gap-4 md:grid-cols-3">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className={`${ui.tile}`}>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{feature.kicker}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h2>
              <p className={`mt-2 text-sm ${ui.textSecondary}`}>{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="fade-up-enter-delay-2 grid gap-4 lg:grid-cols-2">
          <article className={`${ui.panel}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Application Flow</p>
            <h2 className={`mt-2 text-2xl font-semibold ${ui.textPrimary}`}>From authentication to operational tracking</h2>
            <ol className="mt-5 grid gap-3">
              {workflowSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.2rem_1fr] items-start gap-3 rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] text-sm font-semibold text-[var(--accent-gold-text)]">
                    {index + 1}
                  </span>
                  <span className={`pt-1 text-sm ${ui.textSecondary}`}>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={`${ui.panel}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Technical Notes</p>
            <h2 className={`mt-2 text-2xl font-semibold ${ui.textPrimary}`}>Engineering choices recruiters can evaluate</h2>
            <ul className="mt-5 grid gap-3">
              {technicalNotes.map((note) => (
                <li key={note} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {note}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="fade-up-enter-delay-2 rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Explore The Product</p>
              <p className={`mt-2 text-xl font-semibold ${ui.textPrimary}`}>Review the live user flow and core finance operations.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} px-5 py-3`} href="/login" prefetch={false}>
                Open Login
              </Link>
              <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonNeutral} px-5 py-3`} href="/register" prefetch={false}>
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const projectMetrics = [
  { label: "Core Views", value: "Dashboard, Accounts, Settings" },
  { label: "Auth Journey", value: "Register + Email Verify + Login" },
  { label: "Money Ops", value: "Transactions, Transfers, Budgets" },
];

const featureHighlights = [
  {
    kicker: "Portfolio",
    title: "Unified account balances in USD and ARS",
    description: "Each account exposes native and converted totals so users can understand liquidity and exposure at portfolio level.",
  },
  {
    kicker: "Ledger",
    title: "Transaction lifecycle with category controls",
    description: "Income and expense entries support category tagging, editable records, and account-scoped history for auditability.",
  },
  {
    kicker: "Rates",
    title: "Live rate comparisons across market types",
    description: "Official, Blue, CCL, and Crypto rates are pulled in batch and surfaced directly in the dashboard context.",
  },
];

const workflowSteps = [
  "User authenticates with token-based session handling and protected routes.",
  "Accounts are created with exchange-rate profile and default currency.",
  "Transactions and transfers mutate balances and refresh relevant queries.",
  "Budget coverage and month summaries reveal spending progress by category.",
  "Rate widgets provide current conversion references for decision-making.",
];

const technicalNotes = [
  "Next.js App Router with route handlers for auth, accounts, budgets, transactions, transfers, and exchange-rate data.",
  "TanStack Query manages server state, optimistic refresh patterns, and invalidation after financial mutations.",
  "Type-safe request/response contracts drive consistency from API calls to UI forms and modals.",
  "Reusable modal workflows support account operations without leaving dashboard context.",
  "Client-side token store synchronizes login state across tabs via storage and custom events.",
];
