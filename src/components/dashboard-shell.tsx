"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AuthenticatedUser,
  Budget,
  Category,
  CreateTransactionRequest,
  CreateTransferRequest,
  DashboardRecentTransaction,
  MonthlyTransactionSummary,
  PagedResult,
} from "@/lib/contracts";
import { useStoredToken } from "@/lib/storage";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { formatTransactionTypeLabel } from "@/lib/labels";
import { ui } from "@/lib/ui";
import { assistantEnabled } from "@/lib/feature-flags";
import { formatRate, formatShortDateTime } from "@/components/formatters";
import { useEffect, useState } from "react";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { CreateTransferModal } from "@/components/create-transfer-modal";
import { MissingSessionState } from "@/components/missing-session-state";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ErrorBanner, EmptyState, LoadingCard } from "@/components/status-card";

const RECENT_ACTIVITY_PAGE_SIZE = 10;

export function DashboardShell() {
  const accessToken = useStoredToken();
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "ARS">("USD");
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
  const quickStats = buildQuickStats(monthlySummaryQuery.data);

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
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 xl:pl-32 2xl:pl-80 ${ui.page}`}>
        <div className={ui.shellWide}>
          <header className={`${ui.heroPanel} relative bg-[linear-gradient(140deg,rgba(23,34,30,0.95),rgba(15,24,22,0.9))]`}>
            <div className="flex items-center justify-between w-full">
              <div>
                <p className={`text-lg font-semibold sm:text-2xl ${ui.textPrimary}`}>
                  {meQuery.data?.fullName ?? "Cargando..."}
                </p>
                <p className={`mt-1 text-sm ${ui.textMuted}`}>Resumen de portfolio, actividad y presupuestos.</p>
              </div>

              <button
                aria-label="Menu"
                className="p-2 rounded-xl border border-[var(--border-strong)] hover:border-[var(--border-strong-hover)] transition xl:hidden"
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

          {meQuery.isError ? <ErrorBanner message="No se pudo cargar la sesión actual." /> : null}

          <section className={`${ui.panel} fade-up-enter-delay-1 bg-[linear-gradient(165deg,rgba(25,36,33,0.92),rgba(17,25,23,0.92))]`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={`text-xl sm:text-2xl font-semibold ${ui.textPrimary}`}>Total del portfolio</h2>
            </div>

            <div className={`mt-4 sm:mt-5 ${ui.tile} border-[var(--accent-gold-border)] bg-[linear-gradient(165deg,rgba(16,24,22,0.9),rgba(15,21,20,0.9))]`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={`text-sm ${ui.textMuted}`}>{displayCurrency}</p>
                  <p className={`mt-1 text-2xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>
                    {displayCurrency} {formatRate(displayCurrency === "USD" ? portfolioTotals.usd : portfolioTotals.ars)}
                  </p>
                </div>
                <select
                  className={ui.select}
                  onChange={(event) => setDisplayCurrency(event.target.value as "USD" | "ARS")}
                  value={displayCurrency}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--border-soft)] pt-4">
                <button
                  className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
                  onClick={() => setShowTransactionModal(true)}
                  type="button"
                >
                  + Agregar movimiento
                </button>
                {assistantEnabled ? (
                  <Link className={`text-sm ${ui.buttonBase} ${ui.buttonSolidGold}`} href="/assistant">
                    Registrar con IA
                  </Link>
                ) : null}
                <button
                  className={`text-sm ${ui.buttonBase} ${ui.buttonInfo}`}
                  onClick={() => setShowTransferModal(true)}
                  type="button"
                >
                  Transferir
                </button>
              </div>
            </div>
          </section>

          {accountsQuery.isError ? <ErrorBanner message="No se pudieron cargar las cuentas." /> : null}

          <section className="fade-up-enter-delay-1 grid gap-3 sm:gap-4 md:grid-cols-3">
            <QuickStatCard label="Ingresos (mes)" value={`USD ${formatRate(quickStats.incomeUsd)}`} tone="income" />
            <QuickStatCard label="Gastos (mes)" value={`USD ${formatRate(quickStats.expenseUsd)}`} tone="expense" />
            <QuickStatCard label="Cambio neto" value={`USD ${formatRate(quickStats.netUsd)}`} tone={quickStats.netUsd >= 0 ? "income" : "expense"} />
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
              <section className={`${ui.panel} fade-up-enter-delay-1`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Actividad reciente</h2>
                  <span className={ui.badgeInfo}>{recentTransactionsQuery.data?.totalCount ?? 0}</span>
                </div>

                <div className="mt-4 grid gap-3">
                  {recentTransactionsQuery.isLoading ? <LoadingCard label="Cargando movimientos recientes..." /> : null}
                  {recentTransactionsQuery.isError ? <ErrorBanner message="No se pudieron cargar los movimientos recientes." /> : null}
                  {recentTransactionsQuery.data?.items.length === 0 ? <EmptyTransactionsCard onCreateTransaction={() => setShowTransactionModal(true)} /> : null}
                  {recentTransactionsQuery.data?.items.map((transaction) => (
                    <article key={transaction.id} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`inline-flex items-center gap-2 text-sm font-semibold ${ui.textPrimary}`}>
                            <span>{getTransactionIcon(transaction)}</span>
                            <span className="truncate">{transaction.description || "Movimiento"}</span>
                          </p>
                          <p className={`mt-1 text-xs ${ui.textMuted}`}>{transaction.accountName} - {formatShortDateTime(transaction.transactionDate)}</p>
                          {transaction.categoryName ? (
                            <span className={`mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-2 py-0.5 text-[10px] text-[var(--accent-gold-text)]`}>
                              <span>{getCategoryIcon(transaction.categoryName)}</span>
                              {transaction.categoryName}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className={`text-xs uppercase tracking-[0.12em] ${transaction.transactionType === "EXPENSE" ? ui.textExpense : ui.textIncome}`}>
                            {formatTransactionTypeLabel(transaction.transactionType)}
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
                      Página {recentTransactionsQuery.data.page} de {recentTransactionsQuery.data.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`}
                        disabled={recentActivityPage <= 1 || recentTransactionsQuery.isFetching}
                        onClick={() => setRecentActivityPage((page) => Math.max(1, page - 1))}
                        type="button"
                      >
                        Anterior
                      </button>
                      <button
                        className={`text-sm ${ui.buttonBase} ${ui.buttonNeutral}`}
                        disabled={recentActivityPage >= recentTransactionsQuery.data.totalPages || recentTransactionsQuery.isFetching}
                        onClick={() => setRecentActivityPage((page) => page + 1)}
                        type="button"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className={`${ui.panel} fade-up-enter-delay-2`}>
                <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Presupuestos mensuales</h2>

                <div className={`mt-4 ${ui.tile}`}>
                  {budgetsQuery.isLoading ? <LoadingCard label="Cargando presupuestos..." /> : null}
                  {budgetsQuery.isError ? <ErrorBanner message="No se pudieron cargar los presupuestos." /> : null}
                  {budgetsQuery.data?.length === 0 ? (
                    <EmptyState action={<Link className={`inline-flex ${ui.buttonBase} ${ui.buttonNeutral}`} href="/settings#budgets">Crear presupuesto</Link>}>
                      <p className="inline-flex items-center gap-2"><span>[BG]</span>Todavía no hay presupuestos.</p>
                    </EmptyState>
                  ) : null}
                  {budgetsQuery.data?.length ? <BudgetOverview budgets={budgetsQuery.data} /> : null}
                </div>
              </section>
          </div>
        </div>
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
};

function buildQuickStats(monthlySummary: MonthlyTransactionSummary | undefined): QuickStats {
  const incomeUsd = monthlySummary?.incomeUsd ?? 0;
  const expenseUsd = monthlySummary?.expenseUsd ?? 0;
  const netUsd = monthlySummary?.netUsd ?? incomeUsd - expenseUsd;

  return {
    incomeUsd,
    expenseUsd,
    netUsd,
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
  const monthLabel = new Date(Date.UTC(budgets[0].year, budgets[0].month - 1, 1)).toLocaleString("es-AR", {
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
                Restante: {budget.currency} {formatRate(budget.remainingAmount)}
              </span>
            </div>
            {isHighUsage ? (
              <p className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${isExceeded ? "border-[var(--state-danger-border)] text-[var(--state-danger)] bg-[var(--state-danger-soft)]" : "border-[var(--accent-gold-border)] text-[var(--accent-gold-text)] bg-[var(--accent-gold-soft)]"}`}>
                <span>{isExceeded ? "!!" : "!"}</span>
                {isExceeded ? "Presupuesto excedido" : "Cerca del límite"}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
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

function EmptyTransactionsCard({ onCreateTransaction }: { onCreateTransaction: () => void }) {
  return (
    <EmptyState action={<button className={`text-sm ${ui.buttonBase} ${ui.buttonInfo}`} onClick={onCreateTransaction} type="button">Agregar movimiento</button>}>
      <p className="inline-flex items-center gap-2 text-sm">[TX] No hay movimientos recientes.</p>
      <p className="mt-2">Agregá tu primer movimiento para ver resumen mensual y actividad.</p>
    </EmptyState>
  );
}
