"use client";

import { useEffect, useId, useState } from "react";

import { Account, AccountType, CreateAccountRequest } from "@/lib/contracts";
import { ui } from "@/lib/ui";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-hero)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={`text-2xl font-semibold ${ui.textPrimary}`} id={titleId}>Create Account</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Account Name</label>
            <input
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setName(event.target.value)}
              placeholder="My Savings"
              required
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Currency</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setCurrencyCode(event.target.value)}
              value={currencyCode}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="ARS">ARS - Argentine Peso</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm ${ui.textMuted}`}>Account Type</label>
            <select
              className={`mt-1 w-full ${ui.input}`}
              onChange={(event) => setAccountType(event.target.value as AccountType)}
              value={accountType}
            >
              <option value="STANDARD">Standard</option>
              <option value="CREDIT">Credit card</option>
            </select>
          </div>
          {isCreditAccount ? (
            <>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Funding Account</label>
                <select
                  className={`mt-1 w-full ${ui.input}`}
                  onChange={(event) => setFundingAccountId(event.target.value)}
                  required
                  value={resolvedFundingAccountId}
                >
                  {eligibleFundingAccounts.length === 0 ? <option value="">No eligible standard accounts</option> : null}
                  {eligibleFundingAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm ${ui.textMuted}`}>Payment Day of Month</label>
                <input
                  className={`mt-1 w-full ${ui.input}`}
                  max={28}
                  min={1}
                  onChange={(event) => setPaymentDayOfMonth(event.target.value)}
                  required
                  type="number"
                  value={paymentDayOfMonth}
                />
                <p className={`mt-1 text-xs ${ui.textMuted}`}>Valid range: 1 to 28.</p>
              </div>
            </>
          ) : null}
          {isCreditAccount && eligibleFundingAccounts.length === 0 ? (
            <p className="text-sm text-[var(--state-danger)]">Create a standard account first to fund credit payments.</p>
          ) : null}
          {error ? <p className="text-sm text-[var(--state-danger)]">{error}</p> : null}
          <div className="mt-2 flex gap-3">
            <button className={`flex-1 ${ui.buttonBase} ${ui.buttonNeutral}`} onClick={onClose} type="button">
              Cancel
            </button>
            <button className={`flex-1 ${ui.buttonBase} ${ui.buttonSolidGold}`} disabled={isLoading || !canSubmit} type="submit">
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
