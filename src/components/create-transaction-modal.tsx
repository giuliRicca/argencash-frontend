"use client";

import { useId, useMemo, useState } from "react";

import type { Account, Category, CreateTransactionRequest } from "@/lib/contracts";
import { formatAmountInput, normalizeAmountInput, parseAmountInput } from "@/lib/amount-input";
import { ui } from "@/lib/ui";
import { ModalShell } from "@/components/modal-shell";

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
    <ModalShell onClose={onClose} titleId={titleId}>
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Agregar transacción</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Cuenta</label>
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
              Gasto
            </button>
            <button
              type="button"
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${transactionType === "INCOME" ? "border-[var(--state-success-border)] bg-[var(--state-success-soft)] text-[var(--state-success)]" : "border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--border-strong-hover)]"}`}
              onClick={() => {
                setTransactionType("INCOME");
                setCategoryId("");
              }}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <div>
              <label className={`block text-sm ${ui.textMuted}`}>Monto</label>
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
              <label className={`block text-sm ${ui.textMuted}`}>Moneda</label>
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
            <label className={`block text-sm ${ui.textMuted}`}>Descripción (opcional)</label>
            <input
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="¿Para qué fue?"
              type="text"
              value={description}
            />
          </div>

          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Categoría (opcional)</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">Sin categoría</option>
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
              Cancelar
            </button>
            <button
              className={`flex-1 ${ui.buttonBase} ${ui.buttonSolidGold}`}
              disabled={isLoading || !canSubmit}
              type="submit"
            >
              {isLoading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
    </ModalShell>
  );
}
