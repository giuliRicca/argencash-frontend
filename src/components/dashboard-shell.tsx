"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AccountType,
  AuthenticatedUser,
  Budget,
  CreateAccountRequest,
  Category,
  CreateTransactionRequest,
  CreateTransferRequest,
  DashboardRecentTransaction,
  MonthlyTransactionSummary,
  PagedResult,
} from "@/lib/contracts";
import { useStoredToken } from "@/lib/storage";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { ui } from "@/lib/ui";
import { formatRate } from "@/components/formatters";
import { useEffect, useId, useState } from "react";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { CreateTransferModal } from "@/components/create-transfer-modal";
import { MissingSessionState } from "@/components/missing-session-state";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

const RECENT_ACTIVITY_PAGE_SIZE = 10;

export function DashboardShell() {
  const accessToken = useStoredToken();
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "ARS">("USD");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hasLoadedRecentActivity, setHasLoadedRecentActivity] = useState(false);
  const [recentActivityPage, setRecentActivityPage] = useState(1);

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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", accessToken],
    queryFn: () =>
      requestJson<Category[]>("/api/categories", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken) && showTransactionModal,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", accessToken],
    queryFn: () =>
      requestJson<Budget[]>("/api/budgets", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken) && accountsQuery.isSuccess,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const recentTransactionsQuery = useQuery({
    queryKey: ["dashboard-recent-transactions", accessToken, recentActivityPage],
    queryFn: () =>
      requestJson<PagedResult<DashboardRecentTransaction>>(`/api/transactions/recent?page=${recentActivityPage}&pageSize=${RECENT_ACTIVITY_PAGE_SIZE}`, {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken) && hasLoadedRecentActivity,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const monthlySummaryQuery = useQuery({
    queryKey: ["dashboard-monthly-summary", accessToken],
    queryFn: () =>
      requestJson<MonthlyTransactionSummary>("/api/transactions/monthly-summary", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      setRecentActivityPage(1);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", accessToken] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-monthly-summary", accessToken] });
      setShowTransactionModal(false);
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: CreateTransferRequest) =>
      postJson<{ transferGroupId: string }>("/api/transfers", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      setRecentActivityPage(1);
      queryClient.invalidateQueries({ queryKey: ["accounts", accessToken] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });
      setShowTransferModal(false);
    },
  });

  const portfolioTotals = buildPortfolioTotals(accountsQuery.data ?? []);
  const quickStats = buildQuickStats(monthlySummaryQuery.data, accountsQuery.data ?? []);

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

  useEffect(() => {
    if (!accessToken || hasLoadedRecentActivity) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasLoadedRecentActivity(true);
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, hasLoadedRecentActivity]);

  useUnauthorizedRedirect([
    meQuery.error,
    accountsQuery.error,
    categoriesQuery.error,
    budgetsQuery.error,
    recentTransactionsQuery.error,
    monthlySummaryQuery.error,
    createTransactionMutation.error,
    createTransferMutation.error,
    createAccountMutation.error,
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 lg:pl-20 2xl:pl-64 ${ui.page}`}>
        <div className={ui.shellWide}>
          <header className={`${ui.heroPanel} relative bg-[linear-gradient(140deg,rgba(23,34,30,0.95),rgba(15,24,22,0.9))]`}>
            <div className="flex items-center justify-between w-full">
              <div>
                <p className={`text-lg font-semibold sm:text-2xl ${ui.textPrimary}`}>
                  {meQuery.data?.fullName ?? "Loading..."}
                </p>
                <p className={`mt-1 text-sm ${ui.textMuted}`}>Overview of your accounts, activity, and budgets.</p>
              </div>

              <button
                aria-label="Menu"
                className="p-2 rounded-xl border border-[var(--border-strong)] hover:border-[var(--border-strong-hover)] transition lg:hidden"
                onClick={() => setShowMenu(!showMenu)}
                type="button"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </header>

          {meQuery.isError ? <ErrorBanner message="The current session could not be loaded." /> : null}

          <section className={`${ui.panel} fade-up-enter-delay-1 bg-[linear-gradient(165deg,rgba(25,36,33,0.92),rgba(17,25,23,0.92))]`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={`text-xl sm:text-2xl font-semibold ${ui.textPrimary}`}>Portfolio total</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
                  onClick={() => setShowTransactionModal(true)}
                  type="button"
                >
                  + Add transaction
                </button>
                <button
                  className={`text-sm ${ui.buttonBase} ${ui.buttonInfo}`}
                  onClick={() => setShowTransferModal(true)}
                  type="button"
                >
                  Transfer
                </button>
                <Link className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`} href="/settings#budgets">
                  Budgets
                </Link>
              </div>
            </div>

            <div className={`mt-4 sm:mt-5 ${ui.tile} border-[var(--accent-gold-border)] bg-[linear-gradient(165deg,rgba(16,24,22,0.9),rgba(15,21,20,0.9))]`}>
              <p className={`text-sm ${ui.textMuted}`}>{displayCurrency}</p>
              <p className={`mt-1 text-2xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>
                {displayCurrency} {formatRate(displayCurrency === "USD" ? portfolioTotals.usd : portfolioTotals.ars)}
              </p>
              <div className="mt-3 flex justify-start sm:justify-end">
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
          </section>

          <section className="fade-up-enter-delay-1 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickStatCard label="Income (month)" value={`USD ${formatRate(quickStats.incomeUsd)}`} tone="income" />
            <QuickStatCard label="Expenses (month)" value={`USD ${formatRate(quickStats.expenseUsd)}`} tone="expense" />
            <QuickStatCard label="Net change" value={`USD ${formatRate(quickStats.netUsd)}`} tone={quickStats.netUsd >= 0 ? "income" : "expense"} />
            <QuickStatCard label="Credit due soon" value={quickStats.creditDueLabel} tone={quickStats.hasCreditDueSoon ? "warning" : "neutral"} />
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <section className={`${ui.panel} fade-up-enter-delay-1`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={`text-xl sm:text-2xl font-semibold ${ui.textPrimary}`}>Accounts</h2>
                <button
                  className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
                  onClick={() => setShowCreateModal(true)}
                  type="button"
                >
                  + Add
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
                {accountsQuery.isLoading ? <LoadingCard label="Loading accounts..." /> : null}
                {accountsQuery.isError ? <ErrorBanner message="Accounts could not be loaded." /> : null}
                {accountsQuery.data?.length === 0 ? <EmptyCard onCreateAccount={() => setShowCreateModal(true)} /> : null}
                {accountsQuery.data?.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <article className="rounded-2xl border border-[var(--border-muted)] bg-[linear-gradient(165deg,rgba(19,27,25,0.94),rgba(16,23,21,0.94))] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] focus-within:border-[var(--border-strong)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`text-base font-semibold truncate ${ui.textPrimary}`}>{account.name}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.06em] ${ui.badgeGold}`}>
                              {account.exchangeRateType}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] tracking-[0.06em] ${account.accountType === "CREDIT" ? "border-[var(--state-info-border)] bg-[var(--state-info-soft)] text-[var(--state-info)]" : "border-[var(--border-muted)] bg-[var(--surface-3)] text-[var(--text-muted)]"}`}>
                              <span>{getAccountTypeIcon(account.accountType)}</span>
                              {formatAccountTypeLabel(account.accountType)}
                            </span>
                          </div>
                          {account.accountType === "CREDIT" ? (
                            <p className={`mt-2 text-xs ${ui.textMuted}`}>
                              Pays day {account.paymentDayOfMonth ?? "-"} from {resolveFundingAccountName(accountsQuery.data ?? [], account.fundingAccountId)}
                            </p>
                          ) : null}
                          <div className={`mt-2 space-y-1 text-sm ${ui.textMuted}`}>
                            <p>USD {formatRate(account.balanceUsd)}</p>
                            <p>ARS {formatRate(account.balanceArs)}</p>
                          </div>
                        </div>
                        <span className={ui.badgeSuccess}>{account.currencyCode}</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>

            <div className="grid gap-4 auto-rows-min">
              <section className={`${ui.panel} fade-up-enter-delay-1`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Recent activity</h2>
                  <span className={ui.badgeInfo}>{recentTransactionsQuery.data?.totalCount ?? 0}</span>
                </div>

                <div className="mt-4 grid gap-3">
                  {recentTransactionsQuery.isLoading ? <LoadingCard label="Loading recent transactions..." /> : null}
                  {recentTransactionsQuery.isError ? <ErrorBanner message="Recent transactions could not be loaded." /> : null}
                  {recentTransactionsQuery.data?.items.length === 0 ? <EmptyTransactionsCard onCreateTransaction={() => setShowTransactionModal(true)} /> : null}
                  {recentTransactionsQuery.data?.items.map((transaction) => (
                    <article key={transaction.id} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`inline-flex items-center gap-2 text-sm font-semibold ${ui.textPrimary}`}>
                            <span>{getTransactionIcon(transaction)}</span>
                            <span className="truncate">{transaction.description || "Transaction"}</span>
                          </p>
                          <p className={`mt-1 text-xs ${ui.textMuted}`}>{transaction.accountName} - {formatDateTime(transaction.transactionDate)}</p>
                          {transaction.categoryName ? (
                            <span className={`mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-2 py-0.5 text-[10px] text-[var(--accent-gold-text)]`}>
                              <span>{getCategoryIcon(transaction.categoryName)}</span>
                              {transaction.categoryName}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className={`text-xs uppercase tracking-[0.12em] ${transaction.transactionType === "EXPENSE" ? ui.textExpense : ui.textIncome}`}>
                            {transaction.transactionType}
                          </p>
                          <p className={`text-sm font-semibold ${transaction.transactionType === "EXPENSE" ? "text-[var(--state-danger)]" : ui.textPrimary}`}>
                            {transaction.currency} {formatRate(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {recentTransactionsQuery.data && recentTransactionsQuery.data.totalPages > 1 ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm ${ui.textMuted}`}>
                      Page {recentTransactionsQuery.data.page} of {recentTransactionsQuery.data.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`}
                        disabled={recentActivityPage <= 1 || recentTransactionsQuery.isFetching}
                        onClick={() => setRecentActivityPage((page) => Math.max(1, page - 1))}
                        type="button"
                      >
                        Previous
                      </button>
                      <button
                        className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`}
                        disabled={recentActivityPage >= recentTransactionsQuery.data.totalPages || recentTransactionsQuery.isFetching}
                        onClick={() => setRecentActivityPage((page) => page + 1)}
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className={`${ui.panel} fade-up-enter-delay-2`}>
                <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Monthly budgets</h2>

                <div className={`mt-4 ${ui.tile}`}>
                  {budgetsQuery.isLoading ? <LoadingCard label="Loading budgets..." /> : null}
                  {budgetsQuery.isError ? <ErrorBanner message="Budgets could not be loaded." /> : null}
                  {budgetsQuery.data?.length === 0 ? (
                    <div className={`rounded-2xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-4 sm:p-6 text-sm ${ui.textMuted}`}>
                      <p className="inline-flex items-center gap-2"><span>[BG]</span>No budgets yet.</p>
                      <Link className={`mt-3 inline-flex ${ui.buttonBase} ${ui.buttonNeutral}`} href="/settings#budgets">Create budget</Link>
                    </div>
                  ) : null}
                  {budgetsQuery.data?.length ? <BudgetOverview budgets={budgetsQuery.data} /> : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      {showCreateModal ? (
        <CreateAccountModal
          accounts={accountsQuery.data ?? []}
          error={createAccountMutation.isError ? (createAccountMutation.error as Error).message : null}
          isLoading={createAccountMutation.isPending}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createAccountMutation.mutate(data)}
        />
      ) : null}
      {showTransactionModal && accountsQuery.data ? (
        <CreateTransactionModal
          accounts={accountsQuery.data}
          categories={categoriesQuery.data ?? []}
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
    </div>
  );
}

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

type QuickStats = {
  incomeUsd: number;
  expenseUsd: number;
  netUsd: number;
  hasCreditDueSoon: boolean;
  creditDueLabel: string;
};

function buildQuickStats(monthlySummary: MonthlyTransactionSummary | undefined, accounts: Account[]): QuickStats {
  const now = new Date();
  const incomeUsd = monthlySummary?.incomeUsd ?? 0;
  const expenseUsd = monthlySummary?.expenseUsd ?? 0;
  const netUsd = monthlySummary?.netUsd ?? incomeUsd - expenseUsd;

  const creditAccounts = accounts.filter((account) => account.accountType === "CREDIT" && account.paymentDayOfMonth);
  let creditDueLabel = "No credit cards";
  let hasCreditDueSoon = false;

  if (creditAccounts.length > 0) {
    const nowDay = now.getDate();
    const dueInDays = creditAccounts
      .map((account) => {
        const dueDay = account.paymentDayOfMonth ?? nowDay;
        return dueDay >= nowDay ? dueDay - nowDay : 31 - nowDay + dueDay;
      })
      .sort((a, b) => a - b)[0];

    hasCreditDueSoon = dueInDays <= 7;
    creditDueLabel = dueInDays === 0 ? "Due today" : `In ${dueInDays} day${dueInDays === 1 ? "" : "s"}`;
  }

  return {
    incomeUsd,
    expenseUsd,
    netUsd,
    hasCreditDueSoon,
    creditDueLabel,
  };
}

function QuickStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "warning" | "neutral";
}) {
  const toneClass = tone === "income"
    ? "border-[var(--state-success-border)] bg-[linear-gradient(160deg,rgba(16,36,29,0.9),rgba(16,28,24,0.9))]"
    : tone === "expense"
      ? "border-[var(--state-danger-border)] bg-[linear-gradient(160deg,rgba(40,20,25,0.44),rgba(26,19,22,0.4))]"
      : tone === "warning"
        ? "border-[var(--accent-gold-border)] bg-[linear-gradient(160deg,rgba(51,46,31,0.35),rgba(24,23,19,0.45))]"
        : "border-[var(--border-muted)] bg-[var(--surface-2)]";

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className={`text-xs uppercase tracking-[0.14em] ${ui.textMuted}`}>{label}</p>
      <p className={`mt-2 text-lg font-semibold sm:text-xl ${ui.textPrimary}`}>
        {value}
      </p>
    </article>
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
    <div className="grid gap-3 sm:gap-4">
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border-muted)] bg-[linear-gradient(165deg,rgba(18,25,23,0.95),rgba(15,22,20,0.95))] p-3 sm:p-4">
        <p className={`text-xs uppercase tracking-[0.16em] ${ui.textMuted}`}>{monthLabel}</p>
        <div className={`mt-1 sm:mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${ui.textPrimary}`}>
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
        const isHighUsage = budget.usagePercentage >= 80;
        const isExceeded = budget.usagePercentage >= 100;
        const progressBarClass = budget.usagePercentage >= 100
          ? "bg-[linear-gradient(90deg,rgba(244,63,94,0.95),rgba(244,63,94,0.7))]"
          : budget.usagePercentage >= 80
            ? "bg-[linear-gradient(90deg,rgba(219,201,163,0.95),rgba(219,201,163,0.65))]"
            : "bg-[linear-gradient(90deg,rgba(110,231,183,0.95),rgba(110,231,183,0.7))]";

        return (
          <article
            key={budget.id}
            className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${isExceeded ? "border-[var(--state-danger-border)] bg-[var(--state-danger-soft)]" : "border-[var(--border-muted)] bg-[var(--surface-3)]"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`font-medium text-sm sm:text-base ${ui.textPrimary}`}>{budget.categoryName}</p>
              <p className={`text-sm ${ui.textMuted}`}>
                {budget.currency} {formatRate(budget.spentAmount)} / {formatRate(budget.amount)}
              </p>
            </div>
            <div className="mt-2 h-2.5 sm:h-3 rounded-full bg-[var(--surface-2)]">
              <div className={`h-2.5 sm:h-3 rounded-full shadow-[0_0_14px_rgba(219,201,163,0.35)] ${progressBarClass}`} style={{ width: `${progress}%` }} />
            </div>
            <div className={`mt-1.5 flex items-center justify-between text-xs ${ui.textMuted}`}>
              <span>{formatRate(budget.usagePercentage)}%</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-muted)] bg-[var(--surface-2)] px-2 py-0.5">
                Remaining: {budget.currency} {formatRate(budget.remainingAmount)}
              </span>
            </div>
            {isHighUsage ? (
              <p className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${isExceeded ? "border-[var(--state-danger-border)] text-[var(--state-danger)] bg-[var(--state-danger-soft)]" : "border-[var(--accent-gold-border)] text-[var(--accent-gold-text)] bg-[var(--accent-gold-soft)]"}`}>
                <span>{isExceeded ? "!!" : "!"}</span>
                {isExceeded ? "Budget exceeded" : "Approaching budget limit"}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function formatAccountTypeLabel(accountType: AccountType) {
  return accountType === "CREDIT" ? "Credit" : "Standard";
}

function getAccountTypeIcon(accountType: AccountType) {
  return accountType === "CREDIT" ? "[CC]" : "[BK]";
}

function getCategoryIcon(categoryName: string) {
  const value = categoryName.toLowerCase();

  if (value.includes("food") || value.includes("grocery")) {
    return "[FD]";
  }

  if (value.includes("transport") || value.includes("fuel")) {
    return "[TR]";
  }

  if (value.includes("salary") || value.includes("income")) {
    return "[IN]";
  }

  return "[CT]";
}

function getTransactionIcon(transaction: DashboardRecentTransaction) {
  if (transaction.transferGroupId) {
    return "[TF]";
  }

  if (transaction.transactionType === "EXPENSE") {
    return "[-]";
  }

  if (transaction.transactionType === "INCOME") {
    return "[+]";
  }

  return "[TX]";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveFundingAccountName(accounts: Account[], fundingAccountId: string | null) {
  if (!fundingAccountId) {
    return "-";
  }

  return accounts.find((account) => account.id === fundingAccountId)?.name ?? "Unknown account";
}

function resolveFundingAccountDraftId(accounts: Account[], draftFundingAccountId: string) {
  if (accounts.length === 0) {
    return "";
  }

  return accounts.some((account) => account.id === draftFundingAccountId)
    ? draftFundingAccountId
    : accounts[0].id;
}

function LoadingCard({ label }: { label: string }) {
  return <div className={`rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4 text-sm ${ui.textMuted}`}>{label}</div>;
}

function EmptyCard({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>
      <p className="inline-flex items-center gap-2 text-sm">[AC] No accounts yet.</p>
      <p className="mt-2">Create your first account to start tracking balances and transactions.</p>
      <button className={`mt-3 text-sm ${ui.buttonBase} ${ui.buttonGold}`} onClick={onCreateAccount} type="button">Create account</button>
    </div>
  );
}

function EmptyTransactionsCard({ onCreateTransaction }: { onCreateTransaction: () => void }) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>
      <p className="inline-flex items-center gap-2 text-sm">[TX] No recent transactions.</p>
      <p className="mt-2">Add your first transaction to get monthly insights and activity trends.</p>
      <button className={`mt-3 text-sm ${ui.buttonBase} ${ui.buttonInfo}`} onClick={onCreateTransaction} type="button">Add transaction</button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}

function CreateAccountModal({
  accounts,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  accounts: Account[];
  onClose: () => void;
  onSubmit: (data: CreateAccountRequest) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [accountType, setAccountType] = useState<AccountType>("STANDARD");
  const eligibleFundingAccounts = accounts.filter((account) => account.accountType === "STANDARD");
  const [fundingAccountId, setFundingAccountId] = useState(eligibleFundingAccounts[0]?.id ?? "");
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState("1");
  const parsedPaymentDayOfMonth = Number(paymentDayOfMonth);
  const isCreditAccount = accountType === "CREDIT";
  const resolvedFundingAccountId = resolveFundingAccountDraftId(eligibleFundingAccounts, fundingAccountId);
  const hasValidCreditSettings =
    !isCreditAccount ||
    (Boolean(resolvedFundingAccountId) &&
      Number.isInteger(parsedPaymentDayOfMonth) &&
      parsedPaymentDayOfMonth >= 1 &&
      parsedPaymentDayOfMonth <= 28);
  const canSubmit = name.trim().length > 0 && hasValidCreditSettings;

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

    const payload: CreateAccountRequest = {
      name,
      currencyCode,
      accountType,
    };

    if (isCreditAccount) {
      payload.fundingAccountId = resolvedFundingAccountId;
      payload.paymentDayOfMonth = parsedPaymentDayOfMonth;
    }

    onSubmit(payload);
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
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Account Type</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setAccountType(event.target.value as AccountType)}
              value={accountType}
            >
              <option value="STANDARD">Standard</option>
              <option value="CREDIT">Credit card</option>
            </select>
          </div>
          {isCreditAccount ? (
            <>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Funding Account</label>
                <select
                  className={`mt-1 w-full ${ui.input}`}
                  onChange={(event) => setFundingAccountId(event.target.value)}
                  required
                  value={resolvedFundingAccountId}
                >
                  {eligibleFundingAccounts.length === 0 ? <option value="">No eligible standard accounts</option> : null}
                  {eligibleFundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Payment Day of Month</label>
                <input
                  className={`mt-1 w-full ${ui.input}`}
                  max={28}
                  min={1}
                  onChange={(event) => setPaymentDayOfMonth(event.target.value)}
                  required
                  type="number"
                  value={paymentDayOfMonth}
                />
                <p className={`mt-1 text-xs ${ui.textMuted}`}>Valid range: 1 to 28.</p>
              </div>
            </>
          ) : null}
          {isCreditAccount && eligibleFundingAccounts.length === 0 ? (
            <p className="text-sm text-[var(--state-danger)]">Create a standard account first to fund credit payments.</p>
          ) : null}
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
              disabled={isLoading || !canSubmit}
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
