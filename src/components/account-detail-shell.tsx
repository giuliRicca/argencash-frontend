"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { deleteRequest, putJson, requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import { Account, AccountDetail, CreateTransactionRequest, Category, ExchangeRateType, UpdateAccountRequest } from "@/lib/contracts";
import { useStoredToken } from "@/lib/storage";
import { formatDateTime, formatRate } from "@/components/formatters";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { MissingSessionState } from "@/components/missing-session-state";

type AccountDetailShellProps = {
  accountId: string;
};

export function AccountDetailShell({ accountId }: AccountDetailShellProps) {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [exchangeRateTypeDraft, setExchangeRateTypeDraft] = useState<ExchangeRateType>("OFFICIAL");

  const accountQuery = useQuery({
    queryKey: ["account-detail", accountId, accessToken],
    queryFn: () =>
      requestJson<AccountDetail>(`/api/accounts/${accountId}`, {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
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

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_50%,_#0b100f_100%)] px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link className="text-sm text-stone-400 transition hover:text-stone-200" href="/dashboard">
              ← Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-100">{accountQuery.data?.name ?? "Account"}</h1>
            {accountQuery.data ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-3 py-1 text-xs font-medium text-[#e7ddc5]">
                  {accountQuery.data.exchangeRateType}
                </span>
                {isEditingName ? (
                  <>
                    <input
                      className="w-72 rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-2 text-sm text-stone-100 outline-none"
                      onChange={(event) => setAccountNameDraft(event.target.value)}
                      type="text"
                      value={accountNameDraft}
                    />
                    <select
                      className="rounded-2xl border border-[#56635b] bg-[#0f1412] px-3 py-2 text-sm text-stone-100 outline-none"
                      onChange={(event) => setExchangeRateTypeDraft(event.target.value as ExchangeRateType)}
                      value={exchangeRateTypeDraft}
                    >
                      {EXCHANGE_RATE_TYPES.map((rateType) => (
                        <option key={rateType} value={rateType}>
                          {rateType}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-xl bg-[#dbc9a3] px-3 py-2 text-xs font-medium text-[#141915] transition hover:bg-[#e5d5b3] disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={
                        updateAccountNameMutation.isPending ||
                        !hasAccountUpdateChanges(accountQuery.data.name, accountNameDraft, accountQuery.data.exchangeRateType, exchangeRateTypeDraft)
                      }
                      onClick={() => {
                        const payload = buildUpdateAccountPayload(
                          accountQuery.data.name,
                          accountNameDraft,
                          accountQuery.data.exchangeRateType,
                          exchangeRateTypeDraft,
                        );

                        updateAccountNameMutation.mutate(payload);
                      }}
                      type="button"
                    >
                      {updateAccountNameMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="rounded-xl border border-[#56635b] px-3 py-2 text-xs font-medium text-stone-100 transition hover:border-[#6e7d74]"
                      disabled={updateAccountNameMutation.isPending}
                      onClick={() => {
                        setAccountNameDraft(accountQuery.data.name);
                        setExchangeRateTypeDraft(accountQuery.data.exchangeRateType);
                        setIsEditingName(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="rounded-xl border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-3 py-2 text-xs font-medium text-[#e7ddc5] transition hover:bg-[#dbc9a3]/16"
                    onClick={() => {
                      setAccountNameDraft(accountQuery.data.name);
                      setExchangeRateTypeDraft(accountQuery.data.exchangeRateType);
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
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-sm font-medium text-emerald-100/90">
              {accountQuery.data.currencyCode}
            </span>
          ) : null}
        </div>

        {accountQuery.isLoading ? <Card><p className="text-sm text-stone-400">Loading account...</p></Card> : null}
        {accountQuery.isError ? <ErrorBanner message="Account could not be loaded." /> : null}
        {updateAccountNameMutation.error ? <ErrorBanner message={(updateAccountNameMutation.error as Error).message} /> : null}

        {accountQuery.data ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <BalanceCard label="USD total" value={`USD ${formatRate(accountQuery.data.balanceUsd)}`} />
              <BalanceCard label="ARS total" value={`ARS ${formatRate(accountQuery.data.balanceArs)}`} />
            </div>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-stone-100">Transactions</h2>
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-4 py-2 text-sm text-[#e7ddc5]">
                    {accountQuery.data.transactions.length}
                  </span>
                  <button
                    className="rounded-2xl border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-4 py-2 text-sm font-medium text-[#e7ddc5] transition hover:bg-[#dbc9a3]/16"
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {accountQuery.data.transactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#3f4944] bg-[#0f1412] p-6 text-sm text-stone-400">
                    No transactions.
                  </div>
                ) : (
                  accountQuery.data.transactions.map((transaction) => {
                    const isExpense = transaction.transactionType === "EXPENSE";

                    return (
                      <article key={transaction.id} className={`rounded-3xl border p-5 transition ${isExpense ? "border-rose-500/20 bg-rose-500/5" : "border-[#313935] bg-[#0f1412] hover:border-[#4a564f]"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-stone-100">{transaction.description}</p>
                            <p className="mt-1 text-sm text-stone-500">{formatDateTime(transaction.transactionDate)}</p>
                            {transaction.categoryName && (
                              <span className="mt-2 inline-block rounded-full border border-[#dbc9a3]/30 bg-[#dbc9a3]/10 px-3 py-1 text-xs text-[#dbc9a3]">
                                {transaction.categoryName}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-xs uppercase tracking-[0.18em] ${isExpense ? "text-rose-400" : "text-emerald-400"}`}>{formatTransactionType(transaction.transactionType)}</p>
                            <p className={`text-base font-semibold ${isExpense ? "text-rose-200" : "text-stone-100"}`}>
                              {transaction.currency} {formatRate(transaction.amount)}
                            </p>
                            <p className="mt-1 text-sm text-stone-400">USD {formatRate(transaction.convertedAmountUsd)}</p>
                            <p className="text-sm text-stone-400">ARS {formatRate(transaction.convertedAmountArs)}</p>
                            <button
                              className="mt-3 rounded-xl border border-rose-500/30 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={deleteTransactionMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm("Delete this transaction?");
                                if (!confirmed) {
                                  return;
                                }

                                deleteTransactionMutation.mutate(transaction.id);
                              }}
                              type="button"
                            >
                              {deletingTransactionId === transaction.id ? "Deleting..." : "Delete"}
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
          accounts={accountQuery.data ? [{ id: accountId, name: accountQuery.data.name, currencyCode: accountQuery.data.currencyCode, exchangeRateType: accountQuery.data.exchangeRateType, balanceInAccountCurrency: accountQuery.data.balanceInAccountCurrency, balanceUsd: accountQuery.data.balanceUsd, balanceArs: accountQuery.data.balanceArs } satisfies Account] : []}
          categories={categoriesQuery.data}
          error={createTransactionMutation.error ? (createTransactionMutation.error as Error).message : null}
          initialAccountId={accountId}
          isLoading={createTransactionMutation.isPending}
          lockAccount
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createTransactionMutation.mutate(data)}
        />
      ) : null}
    </main>
  );
}

const EXCHANGE_RATE_TYPES: ExchangeRateType[] = ["OFFICIAL", "CCL", "MEP", "BLUE", "CRYPTO"];

function hasAccountUpdateChanges(
  currentName: string,
  draftName: string,
  currentRateType: ExchangeRateType,
  draftRateType: ExchangeRateType,
) {
  const normalizedName = draftName.trim();
  const hasNameChange = normalizedName.length > 0 && normalizedName !== currentName;
  const hasRateTypeChange = draftRateType !== currentRateType;

  return hasNameChange || hasRateTypeChange;
}

function buildUpdateAccountPayload(
  currentName: string,
  draftName: string,
  currentRateType: ExchangeRateType,
  draftRateType: ExchangeRateType,
): UpdateAccountRequest {
  const payload: UpdateAccountRequest = {};
  const normalizedName = draftName.trim();

  if (normalizedName.length > 0 && normalizedName !== currentName) {
    payload.name = normalizedName;
  }

  if (draftRateType !== currentRateType) {
    payload.exchangeRateType = draftRateType;
  }

  return payload;
}

function formatTransactionType(transactionType: string) {
  return transactionType === "EXPENSE" ? "Expense" : "Income";
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">{children}</section>;
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-100">{value}</p>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{message}</div>;
}
