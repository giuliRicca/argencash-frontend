"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { deleteRequest, putJson, requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AccountDetail,
  AccountType,
  AccountTransaction,
  CreateTransactionRequest,
  CreateTransferRequest,
  Category,
  ExchangeRateType,
  UpdateAccountRequest,
  UpdateTransactionRequest,
} from "@/lib/contracts";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { formatDateTime, formatRate } from "@/components/formatters";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { CreateTransferModal } from "@/components/create-transfer-modal";
import { EditTransactionModal } from "@/components/edit-transaction-modal";
import { MissingSessionState } from "@/components/missing-session-state";

type AccountDetailShellProps = {
  accountId: string;
};

export function AccountDetailShell({ accountId }: AccountDetailShellProps) {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AccountTransaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [exchangeRateTypeDraft, setExchangeRateTypeDraft] = useState<ExchangeRateType>("OFFICIAL");
  const [accountTypeDraft, setAccountTypeDraft] = useState<AccountType>("STANDARD");
  const [fundingAccountIdDraft, setFundingAccountIdDraft] = useState("");
  const [paymentDayOfMonthDraft, setPaymentDayOfMonthDraft] = useState("1");

  const accountQuery = useQuery({
    queryKey: ["account-detail", accountId, accessToken],
    queryFn: () =>
      requestJson<AccountDetail>(`/api/accounts/${accountId}?transactionLimit=50`, {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
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
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", accessToken],
    queryFn: () =>
      requestJson<Account[]>('/api/accounts', {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-detail", accountId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowAddModal(false);
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: CreateTransferRequest) =>
      postJson<{ transferGroupId: string }>("/api/transfers", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-detail", accountId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["accounts", accessToken] });
      setShowTransferModal(false);
    },
  });

  const updateAccountNameMutation = useMutation({
    mutationFn: (data: UpdateAccountRequest) =>
      putJson<void, UpdateAccountRequest>(`/api/accounts/${accountId}`, data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-detail", accountId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsEditingName(false);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: string) =>
      deleteRequest(`/api/transactions/${transactionId}`, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onMutate: (transactionId) => {
      setDeletingTransactionId(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-detail", accountId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onSettled: () => {
      setDeletingTransactionId(null);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ transactionId, data }: { transactionId: string; data: UpdateTransactionRequest }) =>
      putJson<void, UpdateTransactionRequest>(`/api/transactions/${transactionId}`, data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-detail", accountId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setEditingTransaction(null);
    },
  });

  const eligibleFundingAccounts = getEligibleFundingAccounts(accountsQuery.data ?? [], accountId);
  const resolvedFundingAccountIdDraft = accountTypeDraft === "CREDIT"
    ? resolveFundingAccountDraftId(eligibleFundingAccounts, fundingAccountIdDraft)
    : fundingAccountIdDraft;

  useUnauthorizedRedirect([
    accountQuery.error,
    categoriesQuery.error,
    accountsQuery.error,
    createTransactionMutation.error,
    createTransferMutation.error,
    updateAccountNameMutation.error,
    deleteTransactionMutation.error,
    updateTransactionMutation.error,
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <main className={ui.page}>
      <div className={ui.shellNarrow}>
        <div className="fade-up-enter flex items-center justify-between gap-4">
          <div>
            <Link className={ui.linkMuted} href="/accounts">
              ← Accounts
            </Link>
            <h1 className={`mt-3 text-3xl font-semibold tracking-tight ${ui.textPrimary}`}>{accountQuery.data?.name ?? "Account"}</h1>
            {accountQuery.data ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={ui.badgeGold}>
                  {accountQuery.data.exchangeRateType}
                </span>
                <span className={`rounded-full border px-2 py-1 text-[11px] tracking-[0.06em] ${accountQuery.data.accountType === "CREDIT" ? "border-[var(--state-info-border)] bg-[var(--state-info-soft)] text-[var(--state-info)]" : "border-[var(--border-muted)] bg-[var(--surface-3)] text-[var(--text-muted)]"}`}>
                  {formatAccountTypeLabel(accountQuery.data.accountType)}
                </span>
                {accountQuery.data.accountType === "CREDIT" ? (
                  <span className={`text-xs ${ui.textMuted}`}>
                    Pays day {accountQuery.data.paymentDayOfMonth ?? "-"} from {resolveFundingAccountName(accountsQuery.data ?? [], accountQuery.data.fundingAccountId)}
                  </span>
                ) : null}
                {isEditingName ? (
                  <>
                    <input
                      className={`w-72 ${ui.input} py-2 text-sm`}
                      onChange={(event) => setAccountNameDraft(event.target.value)}
                      type="text"
                      value={accountNameDraft}
                    />
                    <select
                      className={`${ui.select} py-2`}
                      onChange={(event) => setExchangeRateTypeDraft(event.target.value as ExchangeRateType)}
                      value={exchangeRateTypeDraft}
                    >
                      {EXCHANGE_RATE_TYPES.map((rateType) => (
                        <option key={rateType} value={rateType}>
                          {rateType}
                        </option>
                      ))}
                    </select>
                    <select
                      className={`${ui.select} py-2`}
                      onChange={(event) => setAccountTypeDraft(event.target.value as AccountType)}
                      value={accountTypeDraft}
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="CREDIT">Credit card</option>
                    </select>
                    {accountTypeDraft === "CREDIT" ? (
                      <>
                        <select
                          className={`${ui.select} py-2`}
                          onChange={(event) => setFundingAccountIdDraft(event.target.value)}
                          value={resolvedFundingAccountIdDraft}
                        >
                          {eligibleFundingAccounts.length === 0 ? (
                            <option value="">No eligible standard accounts</option>
                          ) : null}
                          {eligibleFundingAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className={`w-24 ${ui.input} py-2 text-sm`}
                          max={28}
                          min={1}
                          onChange={(event) => setPaymentDayOfMonthDraft(event.target.value)}
                          type="number"
                          value={paymentDayOfMonthDraft}
                        />
                        {eligibleFundingAccounts.length === 0 ? (
                          <span className="text-xs text-[var(--state-danger)]">Create a standard account first.</span>
                        ) : null}
                      </>
                    ) : null}
                    <button
                      className={`${ui.buttonBase} ${ui.buttonSolidGold} rounded-xl px-3 py-2 text-xs`}
                      disabled={
                        updateAccountNameMutation.isPending ||
                        !hasAccountUpdateChanges({
                          currentName: accountQuery.data.name,
                          draftName: accountNameDraft,
                          currentRateType: accountQuery.data.exchangeRateType,
                          draftRateType: exchangeRateTypeDraft,
                          currentAccountType: accountQuery.data.accountType,
                          draftAccountType: accountTypeDraft,
                          currentFundingAccountId: accountQuery.data.fundingAccountId,
                          draftFundingAccountId: resolvedFundingAccountIdDraft,
                          currentPaymentDayOfMonth: accountQuery.data.paymentDayOfMonth,
                          draftPaymentDayOfMonth: paymentDayOfMonthDraft,
                        }) ||
                        !hasValidCreditSettings(accountTypeDraft, resolvedFundingAccountIdDraft, paymentDayOfMonthDraft)
                      }
                      onClick={() => {
                        const payload = buildUpdateAccountPayload(
                          {
                            currentName: accountQuery.data.name,
                            draftName: accountNameDraft,
                            currentRateType: accountQuery.data.exchangeRateType,
                            draftRateType: exchangeRateTypeDraft,
                            currentAccountType: accountQuery.data.accountType,
                            draftAccountType: accountTypeDraft,
                            currentFundingAccountId: accountQuery.data.fundingAccountId,
                            draftFundingAccountId: resolvedFundingAccountIdDraft,
                            currentPaymentDayOfMonth: accountQuery.data.paymentDayOfMonth,
                            draftPaymentDayOfMonth: paymentDayOfMonthDraft,
                          },
                        );

                        updateAccountNameMutation.mutate(payload);
                      }}
                      type="button"
                    >
                      {updateAccountNameMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      className={`${ui.buttonBase} ${ui.buttonNeutral} rounded-xl px-3 py-2 text-xs`}
                      disabled={updateAccountNameMutation.isPending}
                      onClick={() => {
                        setAccountNameDraft(accountQuery.data.name);
                        setExchangeRateTypeDraft(accountQuery.data.exchangeRateType);
                        setAccountTypeDraft(accountQuery.data.accountType);
                        setFundingAccountIdDraft(accountQuery.data.fundingAccountId ?? "");
                        setPaymentDayOfMonthDraft(String(accountQuery.data.paymentDayOfMonth ?? 1));
                        setIsEditingName(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className={`${ui.buttonBase} ${ui.buttonGold} rounded-xl px-3 py-2 text-xs`}
                    onClick={() => {
                      setAccountNameDraft(accountQuery.data.name);
                      setExchangeRateTypeDraft(accountQuery.data.exchangeRateType);
                      setAccountTypeDraft(accountQuery.data.accountType);
                      setFundingAccountIdDraft(accountQuery.data.fundingAccountId ?? "");
                      setPaymentDayOfMonthDraft(String(accountQuery.data.paymentDayOfMonth ?? 1));
                      setIsEditingName(true);
                    }}
                    type="button"
                  >
                    Edit account
                  </button>
                )}
              </div>
            ) : null}
          </div>
          {accountQuery.data ? (
            <span className={ui.badgeSuccess}>
              {accountQuery.data.currencyCode}
            </span>
          ) : null}
        </div>

        {accountQuery.isLoading ? <Card><p className={`text-sm ${ui.textMuted}`}>Loading account...</p></Card> : null}
        {accountQuery.isError ? <ErrorBanner message="Account could not be loaded." /> : null}
        {updateAccountNameMutation.error ? <ErrorBanner message={(updateAccountNameMutation.error as Error).message} /> : null}

        {accountQuery.data ? (
          <>
            <div className="fade-up-enter-delay-1 grid gap-4 md:grid-cols-2">
              <BalanceCard label="USD total" value={`USD ${formatRate(accountQuery.data.balanceUsd)}`} />
              <BalanceCard label="ARS total" value={`ARS ${formatRate(accountQuery.data.balanceArs)}`} />
            </div>

            <Card className="fade-up-enter-delay-2">
              <div className="flex items-center justify-between gap-4">
                <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Transactions</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={ui.badgeGold}>
                    {accountQuery.data.transactions.length}
                  </span>
                  <button
                    className={`text-sm ${ui.buttonBase} ${ui.buttonGold}`}
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add
                  </button>
                  <button
                    className={`text-sm ${ui.buttonBase} ${ui.buttonInfo}`}
                    onClick={() => setShowTransferModal(true)}
                    type="button"
                  >
                    Transfer
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {accountQuery.data.transactions.length === 0 ? (
                  <div className={`rounded-3xl border border-dashed border-[var(--border-dashed)] bg-[var(--surface-2)] p-6 text-sm ${ui.textMuted}`}>
                    No transactions.
                  </div>
                ) : (
                  accountQuery.data.transactions.map((transaction) => {
                    const isExpense = transaction.transactionType === "EXPENSE";
                    const isTransfer = Boolean(transaction.transferGroupId);

                    return (
                      <article key={transaction.id} className={`rounded-3xl border p-5 transition duration-200 hover:-translate-y-0.5 ${isExpense ? "border-[var(--state-danger-border)] bg-[var(--state-danger-soft)]" : "border-[var(--border-muted)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-base font-semibold ${ui.textPrimary}`}>{transaction.description}</p>
                            <p className={`mt-1 text-sm ${ui.textMuted}`}>{formatDateTime(transaction.transactionDate)}</p>
                            {isTransfer ? (
                              <span className={`mt-2 inline-block ${ui.badgeInfo}`}>
                                Transfer
                              </span>
                            ) : null}
                            {isTransfer && transaction.counterpartyAccountName ? (
                              <p className={`mt-2 text-xs ${ui.textMuted}`}>
                                {isExpense ? `To ${transaction.counterpartyAccountName}` : `From ${transaction.counterpartyAccountName}`}
                              </p>
                            ) : null}
                            {transaction.categoryName && (
                              <span className={`mt-2 inline-block ${ui.badgeGold}`}>
                                {transaction.categoryName}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-xs uppercase tracking-[0.18em] ${isExpense ? ui.textExpense : ui.textIncome}`}>{formatTransactionType(transaction.transactionType)}</p>
                            <p className={`text-base font-semibold ${isExpense ? "text-[var(--state-danger)]" : ui.textPrimary}`}>
                              {transaction.currency} {formatRate(transaction.amount)}
                            </p>
                            <p className={`mt-1 text-sm ${ui.textMuted}`}>USD {formatRate(transaction.convertedAmountUsd)}</p>
                            <p className={`text-sm ${ui.textMuted}`}>ARS {formatRate(transaction.convertedAmountArs)}</p>
                            {isTransfer ? (
                              <span className={`mt-3 inline-block rounded-xl border px-3 py-1 text-xs ${ui.textMuted}`}>
                                Transfer not editable
                              </span>
                            ) : (
                              <button
                                className={`mt-3 rounded-xl px-3 py-1 text-xs font-medium ${ui.buttonBase} ${ui.buttonGold}`}
                                disabled={updateTransactionMutation.isPending}
                                onClick={() => setEditingTransaction(transaction)}
                                type="button"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              className={`mt-3 rounded-xl px-3 py-1 text-xs font-medium ${ui.buttonBase} ${ui.buttonDanger}`}
                              disabled={deleteTransactionMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  isTransfer
                                    ? "This is a transfer. Deleting it will remove both sides. Continue?"
                                    : "Delete this transaction?",
                                );
                                if (!confirmed) {
                                  return;
                                }

                                deleteTransactionMutation.mutate(transaction.id);
                              }}
                              type="button"
                            >
                              {deletingTransactionId === transaction.id ? "Deleting..." : isTransfer ? "Delete transfer" : "Delete"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {deleteTransactionMutation.error ? <ErrorBanner message={(deleteTransactionMutation.error as Error).message} /> : null}
            </Card>
          </>
        ) : null}
      </div>
      {showAddModal && categoriesQuery.data ? (
        <CreateTransactionModal
          accounts={accountQuery.data ? [{ id: accountId, name: accountQuery.data.name, currencyCode: accountQuery.data.currencyCode, exchangeRateType: accountQuery.data.exchangeRateType, accountType: accountQuery.data.accountType, fundingAccountId: accountQuery.data.fundingAccountId, paymentDayOfMonth: accountQuery.data.paymentDayOfMonth, balanceInAccountCurrency: accountQuery.data.balanceInAccountCurrency, balanceUsd: accountQuery.data.balanceUsd, balanceArs: accountQuery.data.balanceArs } satisfies Account] : []}
          categories={categoriesQuery.data}
          error={createTransactionMutation.error ? (createTransactionMutation.error as Error).message : null}
          initialAccountId={accountId}
          isLoading={createTransactionMutation.isPending}
          lockAccount
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createTransactionMutation.mutate(data)}
        />
      ) : null}
      {showTransferModal && accountsQuery.data ? (
        <CreateTransferModal
          accounts={accountsQuery.data}
          error={createTransferMutation.error ? (createTransferMutation.error as Error).message : null}
          initialFromAccountId={accountId}
          isLoading={createTransferMutation.isPending}
          lockFromAccount
          onClose={() => setShowTransferModal(false)}
          onSubmit={(data) => createTransferMutation.mutate(data)}
        />
      ) : null}
      {editingTransaction && categoriesQuery.data ? (
        <EditTransactionModal
          categories={categoriesQuery.data}
          error={updateTransactionMutation.error ? (updateTransactionMutation.error as Error).message : null}
          isLoading={updateTransactionMutation.isPending}
          onClose={() => setEditingTransaction(null)}
          onSubmit={(data) => updateTransactionMutation.mutate({ transactionId: editingTransaction.id, data })}
          transaction={editingTransaction}
        />
      ) : null}
    </main>
  );
}

const EXCHANGE_RATE_TYPES: ExchangeRateType[] = ["OFFICIAL", "CCL", "MEP", "BLUE", "CRYPTO"];

type AccountUpdateDraft = {
  currentName: string;
  draftName: string;
  currentRateType: ExchangeRateType;
  draftRateType: ExchangeRateType;
  currentAccountType: AccountType;
  draftAccountType: AccountType;
  currentFundingAccountId: string | null;
  draftFundingAccountId: string;
  currentPaymentDayOfMonth: number | null;
  draftPaymentDayOfMonth: string;
};

function hasAccountUpdateChanges(draft: AccountUpdateDraft) {
  const normalizedName = draft.draftName.trim();
  const hasNameChange = normalizedName.length > 0 && normalizedName !== draft.currentName;
  const hasRateTypeChange = draft.draftRateType !== draft.currentRateType;
  const hasAccountTypeChange = draft.draftAccountType !== draft.currentAccountType;
  const hasFundingAccountChange =
    draft.draftAccountType === "CREDIT" &&
    draft.draftFundingAccountId !== (draft.currentFundingAccountId ?? "");
  const nextPaymentDay = Number(draft.draftPaymentDayOfMonth);
  const hasPaymentDayChange =
    draft.draftAccountType === "CREDIT" &&
    Number.isInteger(nextPaymentDay) &&
    nextPaymentDay !== (draft.currentPaymentDayOfMonth ?? 1);

  return hasNameChange || hasRateTypeChange || hasAccountTypeChange || hasFundingAccountChange || hasPaymentDayChange;
}

function buildUpdateAccountPayload(draft: AccountUpdateDraft): UpdateAccountRequest {
  const payload: UpdateAccountRequest = {};
  const normalizedName = draft.draftName.trim();

  if (normalizedName.length > 0 && normalizedName !== draft.currentName) {
    payload.name = normalizedName;
  }

  if (draft.draftRateType !== draft.currentRateType) {
    payload.exchangeRateType = draft.draftRateType;
  }

  if (draft.draftAccountType !== draft.currentAccountType) {
    payload.accountType = draft.draftAccountType;
  }

  if (draft.draftAccountType === "CREDIT") {
    const paymentDayOfMonth = Number(draft.draftPaymentDayOfMonth);
    if (draft.draftFundingAccountId !== (draft.currentFundingAccountId ?? "")) {
      payload.fundingAccountId = draft.draftFundingAccountId;
    }

    if (Number.isInteger(paymentDayOfMonth) && paymentDayOfMonth !== (draft.currentPaymentDayOfMonth ?? 1)) {
      payload.paymentDayOfMonth = paymentDayOfMonth;
    }
  }

  return payload;
}

function hasValidCreditSettings(accountType: AccountType, fundingAccountId: string, paymentDayOfMonth: string) {
  if (accountType !== "CREDIT") {
    return true;
  }

  const parsedPaymentDay = Number(paymentDayOfMonth);
  return Boolean(fundingAccountId) && Number.isInteger(parsedPaymentDay) && parsedPaymentDay >= 1 && parsedPaymentDay <= 28;
}

function getEligibleFundingAccounts(accounts: Account[], accountId: string) {
  return accounts.filter((account) => account.accountType === "STANDARD" && account.id !== accountId);
}

function resolveFundingAccountDraftId(accounts: Account[], draftFundingAccountId: string) {
  if (accounts.length === 0) {
    return "";
  }

  return accounts.some((account) => account.id === draftFundingAccountId)
    ? draftFundingAccountId
    : accounts[0].id;
}

function formatAccountTypeLabel(accountType: AccountType) {
  return accountType === "CREDIT" ? "Credit" : "Standard";
}

function resolveFundingAccountName(accounts: Account[], fundingAccountId: string | null) {
  if (!fundingAccountId) {
    return "-";
  }

  return accounts.find((account) => account.id === fundingAccountId)?.name ?? "Unknown account";
}

function formatTransactionType(transactionType: string) {
  return transactionType === "EXPENSE" ? "Expense" : "Income";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`${ui.panel} ${className}`.trim()}>{children}</section>;
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className={`text-sm ${ui.textMuted}`}>{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${ui.textPrimary}`}>{value}</p>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}
