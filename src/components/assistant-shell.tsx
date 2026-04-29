"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { postJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AssistantDraftRequest,
  AssistantDraftResponse,
  AssistantTransactionDraft,
  Category,
  CreateTransactionRequest,
} from "@/lib/contracts";
import { assistantEnabled } from "@/lib/feature-flags";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MissingSessionState } from "@/components/missing-session-state";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const emptyManualDraft: AssistantTransactionDraft = {
  accountId: null,
  amount: null,
  currency: "ARS",
  wasCurrencyDefaulted: true,
  transactionType: "EXPENSE",
  description: "",
  categoryId: null,
  categorySkipped: false,
  transactionDate: new Date().toISOString(),
  learningKey: null,
  suggestedCategoryId: null,
};

export function AssistantShell() {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<AssistantTransactionDraft | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<AssistantDraftResponse["followUp"]>(null);
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false);
  const [lastCreatedAccountId, setLastCreatedAccountId] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts", accessToken],
    queryFn: () =>
      requestJson<Account[]>("/api/accounts", {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", accessToken],
    queryFn: () =>
      requestJson<Category[]>("/api/categories", {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    enabled: Boolean(accessToken),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const draftMutation = useMutation({
    mutationFn: (data: AssistantDraftRequest) =>
      postJson<AssistantDraftResponse>("/api/assistant/transaction-draft", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: (response) => {
      setDraft(response.draft);
      setWarnings(response.warnings);
      setFollowUp(response.followUp);
      setAssistantMessage(response.message);
      if (response.message) {
        appendMessage("assistant", response.message);
      } else if (response.followUp) {
        appendMessage("assistant", response.followUp.question);
      } else if (response.state === "ready_to_confirm") {
        appendMessage("assistant", "Revisá el borrador y confirmá para guardar.");
      }
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: (_response, variables) => {
      setLastCreatedAccountId(variables.accountId);
      setDraft(null);
      setWarnings([]);
      setFollowUp(null);
      setAssistantMessage("Transacción guardada.");
      setCategoryManuallyChanged(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-monthly-summary"] });
      appendMessage("assistant", "Transacción guardada.");
    },
  });

  useUnauthorizedRedirect([
    accountsQuery.error,
    categoriesQuery.error,
    draftMutation.error,
    createTransactionMutation.error,
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  if (!assistantEnabled) {
    return <DisabledState showMenu={showMenu} setShowMenu={setShowMenu} />;
  }

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const canSave = Boolean(draft?.accountId && draft.amount && draft.amount > 0 && draft.transactionType && draft.transactionDate);
  const filteredCategories = categories.filter((category) => category.type === draft?.transactionType);

  function appendMessage(role: ChatMessage["role"], content: string) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role, content }]);
  }

  function submitText(text: string, previousDraft = draft) {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    appendMessage("user", trimmedText);
    setInput("");
    setAssistantMessage(null);
    draftMutation.mutate({ text: trimmedText, previousDraft });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitText(input);
  }

  function updateDraft(nextDraft: AssistantTransactionDraft) {
    setDraft(nextDraft);
    setAssistantMessage(null);
  }

  function saveDraft(ignoreDuplicateWarning: boolean) {
    if (!draft?.accountId || !draft.amount || !draft.transactionType || !draft.transactionDate) {
      return;
    }

    createTransactionMutation.mutate({
      accountId: draft.accountId,
      amount: draft.amount,
      currency: draft.currency,
      transactionType: draft.transactionType,
      description: draft.description,
      categoryId: draft.categoryId,
      transactionDate: draft.transactionDate,
      source: "ASSISTANT_TEXT",
      ignoreDuplicateWarning,
      assistantLearningKey: categoryManuallyChanged ? draft.learningKey : null,
      assistantSuggestedCategoryId: categoryManuallyChanged ? draft.suggestedCategoryId : null,
    });
  }

  function startManualMode() {
    setDraft(emptyManualDraft);
    setFollowUp(null);
    setWarnings([]);
    setAssistantMessage(null);
    appendMessage("assistant", "Cargá la transacción manualmente.");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 lg:pl-20 2xl:pl-64 ${ui.page}`}>
        <div className={ui.shellWide}>
          <header className={`${ui.heroPanel} bg-[linear-gradient(140deg,rgba(23,34,30,0.95),rgba(15,24,22,0.9))]`}>
            <div>
              <p className={ui.badgeGold}>Registrar con IA</p>
              <h1 className={`mt-3 text-3xl font-semibold ${ui.textPrimary}`}>Decime qué ingreso o gasto querés registrar.</h1>
              <p className={`mt-2 max-w-2xl text-sm ${ui.textMuted}`}>Texto primero. Voz entra en fase 2 usando misma tubería.</p>
            </div>
            <button aria-label="Menu" className="p-2 rounded-xl border border-[var(--border-strong)] lg:hidden" onClick={() => setShowMenu(!showMenu)} type="button">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>

          {accounts.length === 0 && accountsQuery.isSuccess ? (
            <section className={ui.panel}>
              <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Primero creá una cuenta.</h2>
              <p className={`mt-2 ${ui.textMuted}`}>Necesitás una cuenta para registrar gastos o ingresos con IA.</p>
              <Link className={`mt-4 inline-flex ${ui.buttonBase} ${ui.buttonSolidGold}`} href="/accounts">Crear cuenta</Link>
            </section>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_26rem]">
              <section className={`${ui.panel} min-h-[34rem]`}>
                <div className="flex min-h-[28rem] flex-col gap-4">
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4">
                    {messages.length === 0 ? <p className={ui.textMuted}>Ejemplo: gasté 15 lucas en café con Mercado Pago ayer.</p> : null}
                    {messages.map((message) => (
                      <div key={message.id} className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${message.role === "user" ? "ml-auto bg-[var(--accent-gold-soft)] text-[var(--accent-gold-text)]" : "bg-[var(--surface-1)] text-[var(--text-primary)]"}`}>
                        {message.content}
                      </div>
                    ))}
                  </div>

                  {followUp ? (
                    <div className="flex flex-wrap gap-2">
                      {followUp.options.map((option) => (
                        <button
                          className={`${ui.buttonBase} ${ui.buttonNeutral} text-sm`}
                          key={`${followUp.field}-${option.label}`}
                          onClick={() => {
                            if (!draft) return;
                            const nextDraft = { ...draft, [followUp.field]: option.value } as AssistantTransactionDraft;
                            if (followUp.field === "categoryId") {
                              nextDraft.categorySkipped = option.value === null;
                              setCategoryManuallyChanged(option.value !== null);
                            }
                            submitText(option.label, nextDraft);
                          }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
                    <input
                      className={`flex-1 ${ui.input}`}
                      disabled={draftMutation.isPending}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Escribí un gasto o ingreso..."
                      type="text"
                      value={input}
                    />
                    <button className={`${ui.buttonBase} ${ui.buttonSolidGold}`} disabled={draftMutation.isPending || !input.trim()} type="submit">
                      {draftMutation.isPending ? "Interpretando..." : "Enviar"}
                    </button>
                    <button className={`${ui.buttonBase} ${ui.buttonNeutral}`} onClick={startManualMode} type="button">Cargar manualmente</button>
                  </form>
                </div>
              </section>

              <aside className={`${ui.panel} h-fit`}>
                <h2 className={`text-xl font-semibold ${ui.textPrimary}`}>Borrador</h2>
                {assistantMessage ? <p className={`mt-2 text-sm ${ui.textMuted}`}>{assistantMessage}</p> : null}
                {draft ? (
                  <div className="mt-4 grid gap-4">
                    <DraftEditor
                      accounts={accounts}
                      categories={filteredCategories}
                      draft={draft}
                      onCategoryChange={() => setCategoryManuallyChanged(true)}
                      onChange={updateDraft}
                    />
                    {warnings.map((warning) => <p className="rounded-2xl border border-[var(--accent-info-border)] bg-[var(--accent-info-soft)] p-3 text-sm text-[var(--accent-info)]" key={warning}>{warning}</p>)}
                    {createTransactionMutation.error ? <p className={ui.errorBanner}>{createTransactionMutation.error.message}</p> : null}
                    <button className={`${ui.buttonBase} ${ui.buttonSolidGold}`} disabled={!canSave || createTransactionMutation.isPending} onClick={() => saveDraft(warnings.some((warning) => warning.toLowerCase().includes("duplicado")))} type="button">
                      {createTransactionMutation.isPending ? "Guardando..." : warnings.some((warning) => warning.toLowerCase().includes("duplicado")) ? "Guardar igual" : "Guardar"}
                    </button>
                  </div>
                ) : lastCreatedAccountId ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className={`${ui.buttonBase} ${ui.buttonGold}`} href={`/accounts/${lastCreatedAccountId}`}>Ver transacción</Link>
                    <button className={`${ui.buttonBase} ${ui.buttonNeutral}`} onClick={() => setLastCreatedAccountId(null)} type="button">Registrar otro</button>
                  </div>
                ) : (
                  <p className={`mt-4 ${ui.textMuted}`}>Todavía no hay borrador.</p>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DraftEditor({
  accounts,
  categories,
  draft,
  onCategoryChange,
  onChange,
}: {
  accounts: Account[];
  categories: Category[];
  draft: AssistantTransactionDraft;
  onCategoryChange: () => void;
  onChange: (draft: AssistantTransactionDraft) => void;
}) {
  const dateValue = draft.transactionDate ? draft.transactionDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className={ui.textMuted}>Cuenta</span>
        <select className={ui.input} onChange={(event) => onChange({ ...draft, accountId: event.target.value })} value={draft.accountId ?? ""}>
          <option value="">Elegir cuenta</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <label className="grid gap-1 text-sm">
          <span className={ui.textMuted}>Monto</span>
          <input className={ui.input} inputMode="decimal" onChange={(event) => onChange({ ...draft, amount: Number(event.target.value) || null })} type="number" value={draft.amount ?? ""} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className={ui.textMuted}>Moneda</span>
          <select className={ui.input} onChange={(event) => onChange({ ...draft, currency: event.target.value as "ARS" | "USD", wasCurrencyDefaulted: false })} value={draft.currency}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className={ui.textMuted}>Tipo</span>
        <select className={ui.input} onChange={(event) => onChange({ ...draft, transactionType: event.target.value as "INCOME" | "EXPENSE", categoryId: null, categorySkipped: false })} value={draft.transactionType ?? "EXPENSE"}>
          <option value="EXPENSE">Gasto</option>
          <option value="INCOME">Ingreso</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className={ui.textMuted}>Categoría</span>
        <select
          className={ui.input}
          onChange={(event) => {
            onCategoryChange();
            onChange({ ...draft, categoryId: event.target.value || null, categorySkipped: !event.target.value });
          }}
          value={draft.categoryId ?? ""}
        >
          <option value="">Sin categorizar</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className={ui.textMuted}>Fecha</span>
        <input className={ui.input} onChange={(event) => onChange({ ...draft, transactionDate: `${event.target.value}T12:00:00.000Z` })} type="date" value={dateValue} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className={ui.textMuted}>Descripción</span>
        <input className={ui.input} onChange={(event) => onChange({ ...draft, description: event.target.value })} type="text" value={draft.description} />
      </label>
    </div>
  );
}

function DisabledState({ showMenu, setShowMenu }: { showMenu: boolean; setShowMenu: (show: boolean) => void }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 lg:pl-20 2xl:pl-64 ${ui.page}`}>
        <section className={ui.panel}>
          <h1 className={`text-2xl font-semibold ${ui.textPrimary}`}>Asistente desactivado</h1>
          <p className={`mt-2 ${ui.textMuted}`}>Funcionalidad desactivada por configuración.</p>
        </section>
      </main>
    </div>
  );
}
