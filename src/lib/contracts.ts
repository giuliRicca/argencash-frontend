export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
};

export type ExchangeRateType = "OFFICIAL" | "CCL" | "MEP" | "BLUE" | "CRYPTO";

export type Account = {
  id: string;
  name: string;
  currencyCode: string;
  exchangeRateType: ExchangeRateType;
  balanceInAccountCurrency: number;
  balanceUsd: number;
  balanceArs: number;
};

export type AccountTransaction = {
  id: string;
  amount: number;
  transactionType: string;
  currency: string;
  description: string;
  convertedAmountUsd: number;
  convertedAmountArs: number;
  transactionDate: string;
  categoryId: string | null;
  categoryName: string | null;
};

export type AccountDetail = {
  id: string;
  name: string;
  currencyCode: string;
  exchangeRateType: ExchangeRateType;
  balanceInAccountCurrency: number;
  balanceUsd: number;
  balanceArs: number;
  transactions: AccountTransaction[];
};

export type LiveExchangeRate = {
  baseCurrency: string;
  targetCurrency: string;
  buyRate: number;
  sellRate: number;
  retrievedAtUtc: string;
  source: string;
};

export type LiveExchangeRateByType = {
  rateType: ExchangeRateType;
  rate: LiveExchangeRate;
};

export type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  user: AuthenticatedUser;
};

export type ApiProblem = {
  title?: string;
  detail?: string;
  status?: number;
};

export type CreateAccountRequest = {
  name: string;
  currencyCode: string;
};

export type UpdateAccountRequest = {
  name?: string;
  exchangeRateType?: ExchangeRateType;
};

export type CreateTransactionRequest = {
  accountId: string;
  amount: number;
  currency: string;
  transactionType: string;
  description?: string | null;
  categoryId: string | null;
};

export type Category = {
  id: string;
  name: string;
  type: string;
  isSystem: boolean;
  createdAtUtc: string;
};

export type CreateCategoryRequest = {
  name: string;
  type: string;
};
