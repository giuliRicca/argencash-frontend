"use client";

import { useId, useState } from "react";

import type { Account, AccountType, CreateAccountRequest } from "@/lib/contracts";
import { ui } from "@/lib/ui";
import { ModalShell } from "@/components/modal-shell";

type CreateAccountModalProps = {
  accounts: Account[];
  onClose: () => void;
  onSubmit: (data: CreateAccountRequest) => void;
  isLoading: boolean;
  error: string | null;
};

export function CreateAccountModal({
  accounts,
  onClose,
  onSubmit,
  isLoading,
  error,
}: CreateAccountModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [accountType, setAccountType] = useState<AccountType>("STANDARD");
  const eligibleFundingAccounts = accounts.filter((account) => account.accountType === "STANDARD");
  const [fundingAccountId, setFundingAccountId] = useState(eligibleFundingAccounts[0]?.id ?? "");
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState("1");
  const parsedPaymentDayOfMonth = Number(paymentDayOfMonth);
  const isCreditAccount = accountType === "CREDIT";
  const resolvedFundingAccountId = resolveFundingAccountDraftId(eligibleFundingAccounts, fundingAccountId);
  const hasValidCreditSettings =
    !isCreditAccount ||
    (Boolean(resolvedFundingAccountId) &&
      Number.isInteger(parsedPaymentDayOfMonth) &&
      parsedPaymentDayOfMonth >= 1 &&
      parsedPaymentDayOfMonth <= 28);
  const canSubmit = name.trim().length > 0 && hasValidCreditSettings;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: CreateAccountRequest = {
      name,
      currencyCode,
      accountType,
    };

    if (isCreditAccount) {
      payload.fundingAccountId = resolvedFundingAccountId;
      payload.paymentDayOfMonth = parsedPaymentDayOfMonth;
    }

    onSubmit(payload);
  };

  return (
    <ModalShell onClose={onClose} titleId={titleId}>
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Crear cuenta</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Nombre de cuenta</label>
            <input
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mis ahorros"
              required
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Moneda</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setCurrencyCode(event.target.value)}
              value={currencyCode}
            >
              <option value="USD">USD - Dólar estadounidense</option>
              <option value="ARS">ARS - Peso argentino</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Tipo de cuenta</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setAccountType(event.target.value as AccountType)}
              value={accountType}
            >
              <option value="STANDARD">Común</option>
              <option value="CREDIT">Tarjeta de crédito</option>
            </select>
          </div>
          {isCreditAccount ? (
            <>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Cuenta de pago</label>
                <select
                  className={`mt-1 w-full ${ui.input}`}
                  onChange={(event) => setFundingAccountId(event.target.value)}
                  required
                  value={resolvedFundingAccountId}
                >
                  {eligibleFundingAccounts.length === 0 ? <option value="">No hay cuentas comunes disponibles</option> : null}
                  {eligibleFundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Día de pago del mes</label>
                <input
                  className={`mt-1 w-full ${ui.input}`}
                  max={28}
                  min={1}
                  onChange={(event) => setPaymentDayOfMonth(event.target.value)}
                  required
                  type="number"
                  value={paymentDayOfMonth}
                />
                <p className={`mt-1 text-xs ${ui.textMuted}`}>Rango válido: 1 a 28.</p>
              </div>
            </>
          ) : null}
          {isCreditAccount && eligibleFundingAccounts.length === 0 ? (
            <p className="text-sm text-[var(--state-danger)]">Creá una cuenta común primero para pagar la tarjeta.</p>
          ) : null}
          {error ? <p className="text-sm text-[var(--state-danger)]">{error}</p> : null}
          <div className="mt-2 flex gap-3">
            <button className={`flex-1 ${ui.buttonBase} ${ui.buttonNeutral}`} onClick={onClose} type="button">
              Cancelar
            </button>
            <button className={`flex-1 ${ui.buttonBase} ${ui.buttonSolidGold}`} disabled={isLoading || !canSubmit} type="submit">
              {isLoading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
    </ModalShell>
  );
}

function resolveFundingAccountDraftId(accounts: Account[], draftFundingAccountId: string) {
  if (accounts.length === 0) {
    return "";
  }

  return accounts.some((account) => account.id === draftFundingAccountId)
    ? draftFundingAccountId
    : accounts[0].id;
}
