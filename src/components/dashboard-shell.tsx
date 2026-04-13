"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AuthenticatedUser,
  Budget,
  LiveExchangeRateByType,
  CreateAccountRequest,
  Category,
  CreateTransactionRequest,
  CreateTransferRequest,
  ExchangeRateType,
} from "@/lib/contracts";
import { clearToken, useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { formatRate } from "@/components/formatters";
import { useEffect, useId, useState } from "react";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { CreateTransferModal } from "@/components/create-transfer-modal";
import { MissingSessionState } from "@/components/missing-session-state";

export function DashboardShell() {
  const router = useRouter();
  const accessToken = useStoredToken();
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "ARS">("USD");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me", accessToken],
    queryFn: () =>
      requestJson<AuthenticatedUser>("/api/auth/me", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", accessToken],
    queryFn: () =>
      requestJson<Account[]>("/api/accounts", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const liveRatesQuery = useQuery({
    queryKey: ["live-rates", accessToken, "USD", "ARS"],
    queryFn: () => {
      const rateTypesQuery = DASHBOARD_RATE_TYPES.map((rateType) => `rateTypes=${rateType}`).join("&");

      return requestJson<LiveExchangeRateByType[]>(`/api/exchange-rates/live/batch?baseCurrency=USD&targetCurrency=ARS&${rateTypesQuery}`, {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      });
    },
    enabled: Boolean(accessToken),
    refetchInterval: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", accessToken],
    queryFn: () =>
      requestJson<Category[]>("/api/categories", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", accessToken],
    queryFn: () =>
      requestJson<Budget[]>("/api/budgets", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", accessToken] });
      setShowTransactionModal(false);
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: CreateTransferRequest) =>
      postJson<{ transferGroupId: string }>("/api/transfers", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", accessToken] });
      setShowTransferModal(false);
    },
  });

  const portfolioTotals = buildPortfolioTotals(accountsQuery.data ?? []);

  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountRequest) =>
      postJson<{ id: string }>("/api/accounts", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowCreateModal(false);
    },
  });

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <main className={ui.page}>
      <div className={ui.shellWide}>
        <header className={ui.heroPanel}>
          <div>
            <p className="text-2xl font-semibold text-[var(--text-secondary)]">Dashboard</p>
            <p className={`mt-2 text-lg ${ui.textMuted}`}>Welcome</p>
            <h1 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>
              {meQuery.data?.fullName ?? "Loading..."}
            </h1>
          </div>

          <div className="flex flex-wrap justify-end gap-3 sm:self-auto">
            <Link
              aria-label="Settings"
              className={`inline-flex items-center justify-center px-3 py-2 ${ui.buttonBase} ${ui.buttonNeutral}`}
              href="/settings"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </Link>
            <button
              className={`${ui.buttonBase} ${ui.buttonNeutral}`}
              onClick={() => {
                clearToken();
                router.push("/");
              }}
              type="button"
            >
              Log out
            </button>
          </div>
        </header>

        {meQuery.isError ? <ErrorBanner message="The current session could not be loaded." /> : null}

        <section className={`${ui.panel} fade-up-enter-delay-1`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Portfolio total</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
                onClick={() => setShowTransactionModal(true)}
                type="button"
              >
                + Add Transaction
              </button>
              <button
                className={`text-sm ${ui.buttonBase} ${ui.buttonInfo}`}
                onClick={() => setShowTransferModal(true)}
                type="button"
              >
                Transfer
              </button>
              <Link className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`} href="/settings#budgets">
                Manage Budgets
              </Link>
              <select
                className={ui.select}
                onChange={(event) => setDisplayCurrency(event.target.value as "USD" | "ARS")}
                value={displayCurrency}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          <div className={`mt-5 ${ui.tile}`}>
            <p className={`text-sm ${ui.textMuted}`}>{displayCurrency}</p>
            <p className={`mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>
              {displayCurrency} {formatRate(displayCurrency === "USD" ? portfolioTotals.usd : portfolioTotals.ars)}
            </p>
          </div>
        </section>

        <section className={`${ui.panel} fade-up-enter-delay-1`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Accounts</h2>
            <button
              className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
              onClick={() => setShowCreateModal(true)}
            >
              + Add Account
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {accountsQuery.isLoading ? <LoadingCard label="Loading accounts..." /> : null}
            {accountsQuery.isError ? <ErrorBanner message="Accounts could not be loaded." /> : null}
            {accountsQuery.data?.length === 0 ? <EmptyCard /> : null}
            {accountsQuery.data?.map((account) => (
              <Link key={account.id} href={`/accounts/${account.id}`}>
                <article className="rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] focus-within:border-[var(--border-strong)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-lg font-semibold ${ui.textPrimary}`}>{account.name}</p>
                    <span className={`mt-2 inline-block px-2 py-1 text-[11px] tracking-[0.06em] ${ui.badgeGold}`}>
                      {account.exchangeRateType}
                    </span>
                    <div className={`mt-2 space-y-1 text-sm ${ui.textMuted}`}>
                      <p>USD {formatRate(account.balanceUsd)}</p>
                      <p>ARS {formatRate(account.balanceArs)}</p>
                    </div>
                  </div>
                  <span className={ui.badgeSuccess}>
                    {account.currencyCode}
                  </span>
                </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${ui.panel} fade-up-enter-delay-2`}>
          <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Monthly budgets</h2>

          <div className={`mt-5 ${ui.tile}`}>
            {budgetsQuery.isLoading ? <LoadingCard label="Loading budgets..." /> : null}
            {budgetsQuery.isError ? <ErrorBanner message="Budgets could not be loaded." /> : null}
            {budgetsQuery.data?.length === 0 ? (
              <div className={`rounded-3xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-6 text-sm ${ui.textMuted}`}>
                No budgets yet. Add category budgets in settings.
              </div>
            ) : null}
            {budgetsQuery.data?.length ? <BudgetOverview budgets={budgetsQuery.data} /> : null}
          </div>
        </section>

        <section className={`${ui.panel} fade-up-enter-delay-2`}>
          <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>USD / ARS rates</h2>

          <div className={`mt-5 ${ui.tile}`}>
            {liveRatesQuery.isLoading ? <LoadingCard label="Loading exchange rates..." /> : null}
            {liveRatesQuery.isError ? <ErrorBanner message="Exchange rates could not be loaded." /> : null}
            {liveRatesQuery.data ? (
              <div className="grid gap-4 md:grid-cols-2">
                {liveRatesQuery.data.map((entry) => (
                  <article key={entry.rateType} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-3)] p-4">
                    <p className={`text-xs font-medium uppercase tracking-[0.16em] ${ui.textMuted}`}>{entry.rateType}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <RateCard label="Buy" value={formatRate(entry.rate.buyRate)} />
                      <RateCard label="Sell" value={formatRate(entry.rate.sellRate)} />
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
      {showCreateModal ? (
        <CreateAccountModal
          error={createAccountMutation.isError ? (createAccountMutation.error as Error).message : null}
          isLoading={createAccountMutation.isPending}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createAccountMutation.mutate(data)}
        />
      ) : null}
      {showTransactionModal && categoriesQuery.data && accountsQuery.data ? (
        <CreateTransactionModal
          accounts={accountsQuery.data}
          categories={categoriesQuery.data}
          error={createTransactionMutation.error ? (createTransactionMutation.error as Error).message : null}
          isLoading={createTransactionMutation.isPending}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={(data) => createTransactionMutation.mutate(data)}
        />
      ) : null}
      {showTransferModal && accountsQuery.data ? (
        <CreateTransferModal
          accounts={accountsQuery.data}
          error={createTransferMutation.error ? (createTransferMutation.error as Error).message : null}
          isLoading={createTransferMutation.isPending}
          onClose={() => setShowTransferModal(false)}
          onSubmit={(data) => createTransferMutation.mutate(data)}
        />
      ) : null}
    </main>
  );
}

const DASHBOARD_RATE_TYPES: ExchangeRateType[] = ["OFFICIAL", "BLUE", "CCL", "CRYPTO"];

function buildPortfolioTotals(accounts: Account[]) {
  return accounts.reduce(
    (totals, account) => {
      totals.usd += account.balanceUsd;
      totals.ars += account.balanceArs;
      return totals;
    },
    { usd: 0, ars: 0 },
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-3)] p-5">
      <p className={`text-sm ${ui.textMuted}`}>{label}</p>
      <p className={`mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold leading-none tracking-tight sm:text-2xl ${ui.textPrimary}`}>
        {value}
      </p>
    </div>
  );
}

function BudgetOverview({ budgets }: { budgets: Budget[] }) {
  const monthLabel = new Date(Date.UTC(budgets[0].year, budgets[0].month - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const totalsByCurrency = budgets.reduce(
    (accumulator, budget) => {
      if (budget.currency === "USD") {
        accumulator.totalBudgetUsd += budget.amount;
        accumulator.totalSpentUsd += budget.spentAmount;
      } else {
        accumulator.totalBudgetArs += budget.amount;
        accumulator.totalSpentArs += budget.spentAmount;
      }

      return accumulator;
    },
    {
      totalBudgetUsd: 0,
      totalSpentUsd: 0,
      totalBudgetArs: 0,
      totalSpentArs: 0,
    },
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-3)] p-4">
        <p className={`text-xs uppercase tracking-[0.16em] ${ui.textMuted}`}>{monthLabel}</p>
        <div className={`mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm ${ui.textPrimary}`}>
          <span>
            USD {formatRate(totalsByCurrency.totalSpentUsd)} / {formatRate(totalsByCurrency.totalBudgetUsd)}
          </span>
          <span>
            ARS {formatRate(totalsByCurrency.totalSpentArs)} / {formatRate(totalsByCurrency.totalBudgetArs)}
          </span>
        </div>
      </div>
      {budgets.map((budget) => {
        const progress = Math.min(100, Math.max(0, budget.usagePercentage));
        const progressBarClass = budget.usagePercentage >= 100
          ? "bg-[var(--state-danger)]"
          : budget.usagePercentage >= 80
            ? "bg-[var(--accent-gold)]"
            : "bg-[var(--state-success)]";

        return (
          <article
            key={budget.id}
            className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-3)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className={`font-medium ${ui.textPrimary}`}>{budget.categoryName}</p>
              <p className={`text-sm ${ui.textMuted}`}>
                {budget.currency} {formatRate(budget.spentAmount)} / {formatRate(budget.amount)}
              </p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--surface-2)]">
              <div className={`h-2 rounded-full ${progressBarClass}`} style={{ width: `${progress}%` }} />
            </div>
            <div className={`mt-2 flex items-center justify-between text-xs ${ui.textMuted}`}>
              <span>{formatRate(budget.usagePercentage)}%</span>
              <span>
                Remaining: {budget.currency} {formatRate(budget.remainingAmount)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <div className={`rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>{label}</div>;
}

function EmptyCard() {
  return <div className={`rounded-3xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-6 text-sm ${ui.textMuted}`}>No accounts.</div>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}

function CreateAccountModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: CreateAccountRequest) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, currencyCode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-hero)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Create Account</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Account Name</label>
            <input
              className={`mt-1 w-full ${ui.input}`}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Savings"
              required
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Currency</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(e) => setCurrencyCode(e.target.value)}
              value={currencyCode}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="ARS">ARS - Argentine Peso</option>
            </select>
          </div>
          {error ? <p className="text-sm text-[var(--state-danger)]">{error}</p> : null}
          <div className="mt-2 flex gap-3">
            <button
              className={`flex-1 ${ui.buttonBase} ${ui.buttonNeutral}`}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`flex-1 ${ui.buttonBase} ${ui.buttonSolidGold}`}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
