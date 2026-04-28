"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { postJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import { Account, AccountType, CreateAccountRequest } from "@/lib/contracts";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { formatRate } from "@/components/formatters";
import { MissingSessionState } from "@/components/missing-session-state";
import { CreateAccountModal } from "@/components/create-account-modal";

export function AccountsShell() {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  useUnauthorizedRedirect([accountsQuery.error, createAccountMutation.error]);

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
            <div className="flex w-full items-center justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-semibold sm:text-3xl ${ui.textPrimary}`}>Accounts</h1>
                <p className={`mt-1 text-sm ${ui.textMuted}`}>Manage balances, credit cards, and account settings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`} onClick={() => setShowCreateModal(true)} type="button">
                  + Add account
                </button>
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
            </div>
          </header>

          <section className={`${ui.panel} fade-up-enter-delay-1`}>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accountsQuery.isLoading ? <LoadingCard label="Loading accounts..." /> : null}
              {accountsQuery.isError ? <ErrorBanner message="Accounts could not be loaded." /> : null}
              {accountsQuery.data?.length === 0 ? <EmptyAccountsCard onCreateAccount={() => setShowCreateModal(true)} /> : null}
              {accountsQuery.data?.map((account) => (
                <AccountCard key={account.id} account={account} accounts={accountsQuery.data ?? []} />
              ))}
            </div>
          </section>
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
      </main>
    </div>
  );
}

function AccountCard({ account, accounts }: { account: Account; accounts: Account[] }) {
  return (
    <Link href={`/accounts/${account.id}`}>
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
                Pays day {account.paymentDayOfMonth ?? "-"} from {resolveFundingAccountName(accounts, account.fundingAccountId)}
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
  );
}

function formatAccountTypeLabel(accountType: AccountType) {
  return accountType === "CREDIT" ? "Credit" : "Standard";
}

function getAccountTypeIcon(accountType: AccountType) {
  return accountType === "CREDIT" ? "[CC]" : "[BK]";
}

function resolveFundingAccountName(accounts: Account[], fundingAccountId: string | null) {
  if (!fundingAccountId) {
    return "-";
  }

  return accounts.find((account) => account.id === fundingAccountId)?.name ?? "Unknown account";
}

function LoadingCard({ label }: { label: string }) {
  return <div className={`rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4 text-sm ${ui.textMuted}`}>{label}</div>;
}

function EmptyAccountsCard({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>
      <p className="inline-flex items-center gap-2 text-sm">[AC] No accounts yet.</p>
      <p className="mt-2">Create your first account to start tracking balances and transactions.</p>
      <button className={`mt-3 text-sm ${ui.buttonBase} ${ui.buttonGold}`} onClick={onCreateAccount} type="button">Create account</button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}
