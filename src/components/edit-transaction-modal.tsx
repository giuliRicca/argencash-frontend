"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { AccountTransaction, Category, UpdateTransactionRequest } from "@/lib/contracts";
import { formatAmountInput, normalizeAmountInput, parseAmountInput } from "@/lib/amount-input";
import { ui } from "@/lib/ui";

type EditTransactionModalProps = {
  transaction: AccountTransaction;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: UpdateTransactionRequest) => void;
};

export function EditTransactionModal({
  transaction,
  categories,
  isLoading,
  error,
  onClose,
  onSubmit,
}: EditTransactionModalProps) {
  const titleId = useId();
  const [amount, setAmount] = useState(String(transaction.amount));
  const [currency, setCurrency] = useState<"USD" | "ARS">(
    transaction.currency === "ARS" ? "ARS" : "USD",
  );
  const [categoryId, setCategoryId] = useState<string>(transaction.categoryId ?? "");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === transaction.transactionType),
    [categories, transaction.transactionType],
  );

  const parsedAmount = parseAmountInput(amount);
  const formattedAmount = formatAmountInput(amount);
  const canSubmit = parsedAmount > 0;

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
      amount: parsedAmount,
      currency,
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
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Edit Transaction</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Type</label>
            <p className={`mt-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 text-sm ${ui.textPrimary}`}>
              {transaction.transactionType === "EXPENSE" ? "Expense" : "Income"}
            </p>
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
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
