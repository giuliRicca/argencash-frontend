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
export type AccountType = "STANDARD" | "CREDIT";

export type Account = {
  id: string;
  name: string;
  currencyCode: string;
  exchangeRateType: ExchangeRateType;
  accountType: AccountType;
  fundingAccountId: string | null;
  paymentDayOfMonth: number | null;
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
  transferGroupId: string | null;
  counterpartyAccountId: string | null;
  counterpartyAccountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type AccountDetail = {
  id: string;
  name: string;
  currencyCode: string;
  exchangeRateType: ExchangeRateType;
  accountType: AccountType;
  fundingAccountId: string | null;
  paymentDayOfMonth: number | null;
  balanceInAccountCurrency: number;
  balanceUsd: number;
  balanceArs: number;
  transactions: AccountTransaction[];
};

export type DashboardRecentTransaction = AccountTransaction & {
  accountId: string;
  accountName: string;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type MonthlyTransactionSummary = {
  incomeUsd: number;
  expenseUsd: number;
  netUsd: number;
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
  accountType: AccountType;
  fundingAccountId?: string;
  paymentDayOfMonth?: number;
};

export type UpdateAccountRequest = {
  name?: string;
  exchangeRateType?: ExchangeRateType;
  accountType?: AccountType;
  fundingAccountId?: string;
  paymentDayOfMonth?: number;
};

export type CreditSettlementProcessResult = {
  processedCount: number;
  skippedCount: number;
};

export type CreateTransactionRequest = {
  accountId: string;
  amount: number;
  currency: string;
  transactionType: string;
  description?: string | null;
  categoryId: string | null;
  transactionDate?: string;
  source?: "MANUAL" | "ASSISTANT_TEXT" | "ASSISTANT_VOICE";
  ignoreDuplicateWarning?: boolean;
  assistantLearningKey?: string | null;
  assistantSuggestedCategoryId?: string | null;
};

export type UpdateTransactionRequest = {
  amount: number;
  currency: string;
  categoryId: string | null;
};

export type CreateTransferRequest = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string | null;
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

export type Budget = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: "USD" | "ARS";
  spentAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  month: number;
  year: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CreateBudgetRequest = {
  categoryId: string;
  amount: number;
  currency: "USD" | "ARS";
};

export type UpdateBudgetRequest = {
  categoryId: string;
  amount: number;
  currency: "USD" | "ARS";
};

export type RegistrationInitiateRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type RegistrationInitiateResponse = {
  message: string;
  expiresAtUtc: string;
};

export type VerifyEmailRequest = {
  verificationToken: string;
};

export type ResendVerificationRequest = {
  email: string;
};

export type AssistantTransactionDraft = {
  accountId: string | null;
  amount: number | null;
  currency: "ARS" | "USD";
  wasCurrencyDefaulted: boolean;
  transactionType: "INCOME" | "EXPENSE" | null;
  description: string;
  categoryId: string | null;
  categorySkipped: boolean;
  transactionDate: string | null;
  learningKey: string | null;
  suggestedCategoryId: string | null;
};

export type AssistantFollowUpOption = {
  label: string;
  value: string | null;
};

export type AssistantFollowUp = {
  field: string;
  question: string;
  options: AssistantFollowUpOption[];
};

export type AssistantDraftRequest = {
  text: string;
  previousDraft?: AssistantTransactionDraft | null;
};

export type AssistantDraftResponse = {
  state: "ready_to_confirm" | "needs_followup" | "unsupported";
  draft: AssistantTransactionDraft | null;
  followUp: AssistantFollowUp | null;
  warnings: string[];
  message: string | null;
};

export type AssistantChatAction = "save_anyway";

export type AssistantChatRequest = {
  text: string;
  action?: AssistantChatAction | null;
  previousDraft?: AssistantTransactionDraft | null;
};

export type AssistantSavedTransaction = {
  transactionId: string;
  accountId: string;
  accountName: string;
  amount: number;
  currency: string;
  transactionType: "INCOME" | "EXPENSE" | string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  transactionDate: string;
  source: "ASSISTANT_TEXT" | "ASSISTANT_VOICE" | "MANUAL" | string;
};

export type AssistantTransactionPreview = Omit<AssistantSavedTransaction, "transactionId" | "source">;

export type AssistantChatResponse = {
  type: "transaction_saved" | "needs_followup" | "duplicate_warning" | "unsupported" | "finance_answer";
  message: string;
  transaction: AssistantSavedTransaction | null;
  draft: AssistantTransactionDraft | null;
  transactionPreview: AssistantTransactionPreview | null;
  followUp: AssistantFollowUp | null;
  warnings: string[];
};
