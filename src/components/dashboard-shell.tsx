"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { requestJson, postJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import { Account, AuthenticatedUser, LiveExchangeRateByType, CreateAccountRequest, Category, CreateTransactionRequest, CreateTransferRequest, ExchangeRateType } from "@/lib/contracts";
import { clearToken, useStoredToken } from "@/lib/storage";
import { formatRate } from "@/components/formatters";
import { useState } from "react";
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

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_50%,_#0b100f_100%)] px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/8 bg-[linear-gradient(145deg,_rgba(16,24,21,0.96),_rgba(20,31,27,0.88))] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div>
            <p className="text-lg text-stone-400">Welcome</p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
              {meQuery.data?.fullName ?? "Loading..."}
            </h1>
            <p className="mt-2 text-2xl font-semibold text-stone-300">Dashboard</p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 sm:self-auto">
            <Link
              aria-label="Settings"
              className="inline-flex items-center justify-center rounded-2xl border border-[#56635b] px-3 py-2 text-stone-100 transition hover:border-[#6e7d74]"
              href="/settings"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </Link>
            <button
              className="rounded-2xl border border-[#56635b] px-4 py-2 font-medium text-stone-100 transition hover:border-[#6e7d74]"
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

        <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-stone-100">Portfolio total</h2>
            <div className="flex items-center gap-3">
              <button
                className="rounded-2xl border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-4 py-2 text-sm font-medium text-[#e7ddc5] transition hover:bg-[#dbc9a3]/16"
                onClick={() => setShowTransactionModal(true)}
                type="button"
              >
                + Add Transaction
              </button>
              <button
                className="rounded-2xl border border-[#5a6f95]/30 bg-[#5a6f95]/12 px-4 py-2 text-sm font-medium text-[#c8d4ec] transition hover:bg-[#5a6f95]/20"
                onClick={() => setShowTransferModal(true)}
                type="button"
              >
                Transfer
              </button>
              <select
                className="rounded-2xl border border-[#56635b] bg-[#0f1412] px-3 py-2 text-sm text-stone-100 outline-none"
                onChange={(event) => setDisplayCurrency(event.target.value as "USD" | "ARS")}
                value={displayCurrency}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-[#313935] bg-[#0f1412] p-5">
            <p className="text-sm text-stone-500">{displayCurrency}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
              {displayCurrency} {formatRate(displayCurrency === "USD" ? portfolioTotals.usd : portfolioTotals.ars)}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-stone-100">Accounts</h2>
            <button
              className="rounded-2xl border border-[#dbc9a3]/20 bg-[#dbc9a3]/8 px-4 py-2 text-sm font-medium text-[#e7ddc5] transition hover:bg-[#dbc9a3]/16"
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
                <article className="rounded-3xl border border-[#313935] bg-[#0f1412] p-5 transition hover:border-[#4a564f]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-stone-100">{account.name}</p>
                    <span className="mt-2 inline-block rounded-full border border-[#dbc9a3]/30 bg-[#dbc9a3]/10 px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-[#dbc9a3]">
                      {account.exchangeRateType}
                    </span>
                    <div className="mt-2 space-y-1 text-sm text-stone-400">
                      <p>USD {formatRate(account.balanceUsd)}</p>
                      <p>ARS {formatRate(account.balanceArs)}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-sm font-medium text-emerald-100/90">
                    {account.currencyCode}
                  </span>
                </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
          <h2 className="text-2xl font-semibold text-stone-100">USD / ARS rates</h2>

          <div className="mt-5 rounded-3xl border border-[#313935] bg-[#0f1412] p-5">
            {liveRatesQuery.isLoading ? <LoadingCard label="Loading exchange rates..." /> : null}
            {liveRatesQuery.isError ? <ErrorBanner message="Exchange rates could not be loaded." /> : null}
            {liveRatesQuery.data ? (
              <div className="grid gap-4 md:grid-cols-2">
                {liveRatesQuery.data.map((entry) => (
                  <article key={entry.rateType} className="rounded-2xl border border-[#313935] bg-[#111816] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">{entry.rateType}</p>
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
    <div className="rounded-3xl border border-[#313935] bg-[#111715] p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold leading-none tracking-tight text-stone-100 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <div className="rounded-3xl border border-[#313935] bg-[#0f1412] p-5 text-sm text-stone-400">{label}</div>;
}

function EmptyCard() {
  return <div className="rounded-3xl border border-dashed border-[#3f4944] bg-[#0f1412] p-6 text-sm text-stone-400">No accounts.</div>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{message}</div>;
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
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, currencyCode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/8 bg-[#131917] p-8 shadow-[0_24px_100px_rgba(0,0,0,0.4)]">
        <h2 className="text-2xl font-semibold text-stone-100">Create Account</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-stone-400">Account Name</label>
            <input
              className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
              onChange={(e) => setName(e.target.value)}
              placeholder="My Savings"
              required
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400">Currency</label>
            <select
              className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
              onChange={(e) => setCurrencyCode(e.target.value)}
              value={currencyCode}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="ARS">ARS - Argentine Peso</option>
            </select>
          </div>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <div className="mt-2 flex gap-3">
            <button
              className="flex-1 rounded-2xl border border-[#56635b] px-4 py-3 font-medium text-stone-100 transition hover:border-[#6e7d74]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-2xl bg-[#dbc9a3] px-4 py-3 font-medium text-[#141915] transition hover:bg-[#e5d5b3]"
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
