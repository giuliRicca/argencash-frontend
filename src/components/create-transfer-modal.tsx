"use client";

import { useMemo, useState } from "react";

import { Account, CreateTransferRequest } from "@/lib/contracts";
import { ui } from "@/lib/ui";

type CreateTransferModalProps = {
  accounts: Account[];
  initialFromAccountId?: string;
  lockFromAccount?: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CreateTransferRequest) => void;
};

export function CreateTransferModal({
  accounts,
  initialFromAccountId,
  lockFromAccount = false,
  isLoading,
  error,
  onClose,
  onSubmit,
}: CreateTransferModalProps) {
  const initialFromAccount = useMemo(
    () => accounts.find((account) => account.id === initialFromAccountId) ?? accounts[0] ?? null,
    [accounts, initialFromAccountId],
  );

  const initialToAccount = useMemo(
    () => accounts.find((account) => account.id !== initialFromAccount?.id) ?? accounts[0] ?? null,
    [accounts, initialFromAccount?.id],
  );

  const [fromAccountId, setFromAccountId] = useState(initialFromAccount?.id ?? "");
  const [toAccountId, setToAccountId] = useState(initialToAccount?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");
  const [description, setDescription] = useState("");

  const parsedAmount = parseAmount(amount);
  const formattedAmount = formatAmountInput(amount);
  const canSubmit = Boolean(fromAccountId && toAccountId && fromAccountId !== toAccountId && parsedAmount > 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      fromAccountId,
      toAccountId,
      amount: parsedAmount,
      currency,
      description: description.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-hero)]">
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Transfer Between Accounts</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>From account</label>
            <select
              className={`mt-1 w-full ${ui.input} disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={lockFromAccount}
              onChange={(event) => setFromAccountId(event.target.value)}
              value={fromAccountId}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm ${ui.textMuted}`}>To account</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setToAccountId(event.target.value)}
              value={toAccountId}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
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
              placeholder="Transfer note"
              type="text"
              value={description}
            />
          </div>

          {fromAccountId === toAccountId ? <p className="text-sm text-[var(--state-danger)]">Select two different accounts.</p> : null}
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
              {isLoading ? "Transferring..." : "Transfer"}
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
