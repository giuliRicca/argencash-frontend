import type { AccountType } from "@/lib/contracts";

export function formatAccountTypeLabel(accountType: AccountType) {
  return accountType === "CREDIT" ? "Tarjeta de crédito" : "Cuenta común";
}

export function formatTransactionTypeLabel(transactionType: "INCOME" | "EXPENSE" | string) {
  return transactionType === "EXPENSE" ? "Gasto" : "Ingreso";
}

export function formatSystemLabel(isSystem: boolean) {
  return isSystem ? "Sistema" : "Personalizada";
}
