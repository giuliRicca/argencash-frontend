"use client";

import { useMemo, useState } from "react";

import { Account, Category, CreateTransactionRequest } from "@/lib/contracts";

type CreateTransactionModalProps = {
  accounts: Account[];
  categories: Category[];
  initialAccountId?: string;
  lockAccount?: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => void;
};

export function CreateTransactionModal({
  accounts,
  categories,
  initialAccountId,
  lockAccount = false,
  isLoading,
  error,
  onClose,
  onSubmit,
}: CreateTransactionModalProps) {
  const initialAccount = useMemo(
    () => accounts.find((account) => account.id === initialAccountId) ?? accounts[0] ?? null,
    [accounts, initialAccountId],
  );

  const [selectedAccountId, setSelectedAccountId] = useState(initialAccount?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryId, setCategoryId] = useState<string>("");

  const filteredCategories = categories.filter((category) => category.type === transactionType);
  const effectiveAccountId = selectedAccountId || initialAccount?.id || "";
  const parsedAmount = parseAmount(amount);
  const formattedAmount = formatAmountInput(amount);

  const canSubmit = Boolean(effectiveAccountId && parsedAmount > 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      accountId: effectiveAccountId,
      amount: parsedAmount,
      currency,
      transactionType,
      description: description.trim(),
      categoryId: categoryId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/8 bg-[#131917] p-8 shadow-[0_24px_100px_rgba(0,0,0,0.4)]">
        <h2 className="text-2xl font-semibold text-stone-100">Add Transaction</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-stone-400">Account</label>
            <select
              className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none disabled:cursor-not-allowed disabled:opacity-70"
              disabled={lockAccount}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              value={effectiveAccountId}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${transactionType === "EXPENSE" ? "border-rose-500/50 bg-rose-500/20 text-rose-200" : "border-[#56635b] text-stone-400 hover:border-[#6e7d74]"}`}
              onClick={() => {
                setTransactionType("EXPENSE");
                setCategoryId("");
              }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${transactionType === "INCOME" ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200" : "border-[#56635b] text-stone-400 hover:border-[#6e7d74]"}`}
              onClick={() => {
                setTransactionType("INCOME");
                setCategoryId("");
              }}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <div>
              <label className="block text-sm text-stone-400">Amount</label>
              <input
                className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
                inputMode="decimal"
                onChange={(event) => setAmount(normalizeAmountInput(event.target.value))}
                placeholder="0.00"
                required
                type="text"
                value={formattedAmount}
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400">Currency</label>
              <select
                className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
                onChange={(event) => setCurrency(event.target.value as "USD" | "ARS")}
                value={currency}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-stone-400">Description (optional)</label>
            <input
              className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What was this for?"
              type="text"
              value={description}
            />
          </div>

          <div>
            <label className="block text-sm text-stone-400">Category (optional)</label>
            <select
              className="mt-1 w-full rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">No category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
              className="flex-1 rounded-2xl bg-[#dbc9a3] px-4 py-3 font-medium text-[#141915] transition hover:bg-[#e5d5b3] disabled:cursor-not-allowed disabled:opacity-70"
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

function normalizeAmountInput(value: string) {
  const sanitizedValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const decimalSeparatorIndex = sanitizedValue.indexOf(".");

  if (decimalSeparatorIndex === -1) {
    return sanitizedValue;
  }

  const integerPart = sanitizedValue.slice(0, decimalSeparatorIndex);
  const decimalPart = sanitizedValue.slice(decimalSeparatorIndex + 1).replace(/\./g, "").slice(0, 2);

  return `${integerPart}.${decimalPart}`;
}

function formatAmountInput(value: string) {
  if (!value) {
    return "";
  }

  const [integerPart, decimalPart] = value.split(".");
  const formattedIntegerPart = integerPart
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(integerPart))
    : "0";

  if (decimalPart === undefined) {
    return formattedIntegerPart;
  }

  return `${formattedIntegerPart}.${decimalPart}`;
}

function parseAmount(value: string) {
  if (!value) {
    return 0;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
