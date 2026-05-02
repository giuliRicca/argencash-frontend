"use client";

import { useId, useMemo, useState } from "react";

import type { Account, CreateTransferRequest } from "@/lib/contracts";
import { formatAmountInput, normalizeAmountInput, parseAmountInput } from "@/lib/amount-input";
import { ui } from "@/lib/ui";
import { ModalShell } from "@/components/modal-shell";

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
  const titleId = useId();
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

  const parsedAmount = parseAmountInput(amount);
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
    <ModalShell onClose={onClose} titleId={titleId}>
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Transferir entre cuentas</h2>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Desde cuenta</label>
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
            <label className={`block text-sm ${ui.textMuted}`}>Hacia cuenta</label>
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
              placeholder="Nota de transferencia"
              type="text"
              value={description}
            />
          </div>

          {fromAccountId === toAccountId ? <p className="text-sm text-[var(--state-danger)]">Elegí dos cuentas distintas.</p> : null}
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
              {isLoading ? "Transfiriendo..." : "Transferir"}
            </button>
          </div>
        </form>
    </ModalShell>
  );
}
