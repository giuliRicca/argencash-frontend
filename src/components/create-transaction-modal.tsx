"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Account, Category, CreateTransactionRequest } from "@/lib/contracts";
import { formatAmountInput, normalizeAmountInput, parseAmountInput } from "@/lib/amount-input";
import { ui } from "@/lib/ui";

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
  const titleId = useId();
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
  const parsedAmount = parseAmountInput(amount);
  const formattedAmount = formatAmountInput(amount);

  const canSubmit = Boolean(effectiveAccountId && parsedAmount > 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-hero)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Add Transaction</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Account</label>
            <select
              className={`mt-1 w-full ${ui.input} disabled:cursor-not-allowed disabled:opacity-70`}
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
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${transactionType === "EXPENSE" ? "border-[var(--state-danger-border)] bg-[var(--state-danger-soft)] text-[var(--state-danger)]" : "border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--border-strong-hover)]"}`}
              onClick={() => {
                setTransactionType("EXPENSE");
                setCategoryId("");
              }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${transactionType === "INCOME" ? "border-[var(--state-success-border)] bg-[var(--state-success-soft)] text-[var(--state-success)]" : "border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--border-strong-hover)]"}`}
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
              <label className={`block text-sm ${ui.textMuted}`}>Amount</label>
              <input
                className={`mt-1 w-full ${ui.input}`}
                inputMode="decimal"
                onChange={(event) => setAmount(normalizeAmountInput(event.target.value))}
                placeholder="0.00"
                required
                type="text"
                value={formattedAmount}
              />
            </div>

            <div>
              <label className={`block text-sm ${ui.textMuted}`}>Currency</label>
              <select
                className={`mt-1 w-full ${ui.input}`}
                onChange={(event) => setCurrency(event.target.value as "USD" | "ARS")}
                value={currency}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Description (optional)</label>
            <input
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What was this for?"
              type="text"
              value={description}
            />
          </div>

          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Category (optional)</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
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
