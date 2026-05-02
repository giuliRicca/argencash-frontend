"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { deleteRequest, postJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  Account,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantFollowUp,
  AssistantSavedTransaction,
  AssistantTransactionDraft,
  AssistantTransactionPreview,
  Category,
  CreateTransactionRequest,
} from "@/lib/contracts";
import { assistantEnabled } from "@/lib/feature-flags";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { CreateTransactionModal } from "@/components/create-transaction-modal";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MissingSessionState } from "@/components/missing-session-state";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "receipt" | "warning";
  content?: string;
  transaction?: AssistantSavedTransaction;
  preview?: AssistantTransactionPreview;
  warnings?: string[];
  undone?: boolean;
};

export function AssistantShell() {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<AssistantTransactionDraft | null>(null);
  const [followUp, setFollowUp] = useState<AssistantFollowUp | null>(null);
  const [lastSubmittedText, setLastSubmittedText] = useState("");
  const [showTransactionModal, setShowTransactionModal] = useState(false);

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

  const chatMutation = useMutation({
    mutationFn: (data: AssistantChatRequest) =>
      postJson<AssistantChatResponse>("/api/assistant/chat", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: (response) => {
      handleChatResponse(response);
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      postJson<{ id: string }>("/api/transactions", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      setShowTransactionModal(false);
      invalidateDashboardData();
      appendMessage("assistant", "Movimiento manual guardado.");
    },
  });

  const undoTransactionMutation = useMutation({
    mutationFn: (transactionId: string) =>
      deleteRequest(`/api/transactions/${transactionId}`, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: (_response, transactionId) => {
      setMessages((current) => current.map((message) => (
        message.transaction?.transactionId === transactionId ? { ...message, undone: true } : message
      )));
      appendMessage("assistant", "Transacción deshecha.");
      invalidateDashboardData();
    },
  });

  useUnauthorizedRedirect([
    accountsQuery.error,
    categoriesQuery.error,
    chatMutation.error,
    createTransactionMutation.error,
    undoTransactionMutation.error,
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  if (!assistantEnabled) {
    return <DisabledState showMenu={showMenu} setShowMenu={setShowMenu} />;
  }

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  function appendMessage(role: ChatMessage["role"], content: string) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role, content }]);
  }

  function appendReceipt(transaction: AssistantSavedTransaction, responseWarnings: string[]) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "receipt", transaction, warnings: responseWarnings }]);
  }

  function appendDuplicateWarning(preview: AssistantTransactionPreview, responseWarnings: string[]) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "warning", content: "Posible duplicado. ¿Guardar igual?", preview, warnings: responseWarnings }]);
  }

  function invalidateDashboardData() {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-recent-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-monthly-summary"] });
  }

  function handleChatResponse(response: AssistantChatResponse) {
    setDraft(response.draft);
    setFollowUp(response.followUp);

    if (response.type === "transaction_saved" && response.transaction) {
      appendReceipt(response.transaction, response.warnings);
      invalidateDashboardData();
      return;
    }

    if (response.type === "duplicate_warning" && response.transactionPreview) {
      appendDuplicateWarning(response.transactionPreview, response.warnings);
      return;
    }

    if (response.type === "needs_followup" && response.followUp) {
      appendMessage("assistant", response.followUp.question);
      return;
    }

    appendMessage("assistant", response.message || "No pude procesar ese mensaje.");
  }

  function submitText(text: string, previousDraft = draft, action?: AssistantChatRequest["action"], appendUser = true) {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    if (appendUser) {
      appendMessage("user", trimmedText);
    }
    setLastSubmittedText(trimmedText);
    setInput("");
    chatMutation.mutate({ text: trimmedText, previousDraft, action });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitText(input);
  }

  function saveDuplicateAnyway() {
    if (!draft) {
      return;
    }

    submitText(lastSubmittedText || draft.description || "Guardar igual", draft, "save_anyway", false);
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 xl:pl-32 2xl:pl-80 ${ui.page}`}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`text-2xl font-semibold tracking-tight ${ui.textPrimary}`}>Chat</h1>
              <p className={`mt-1 text-sm ${ui.textMuted}`}>Registrá movimientos con mensajes cortos.</p>
            </div>
            <button aria-label="Menu" className="p-2 rounded-xl border border-[var(--border-strong)] xl:hidden" onClick={() => setShowMenu(!showMenu)} type="button">
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
            <section className={`${ui.panel} min-h-[calc(100vh-11rem)] bg-[linear-gradient(180deg,rgba(17,25,23,0.92),rgba(13,19,18,0.96))]`}>
              <div className="flex min-h-[calc(100vh-15rem)] flex-col gap-4">
                <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-4">
                  {messages.length === 0 ? (
                    <div className="grid gap-3 text-sm">
                      <p className={ui.textMuted}>Probá con mensajes cortos:</p>
                      <div className="flex flex-wrap gap-2">
                        {["4500 café", "mp 12k uber ayer", "cobré 2650 dólares"].map((example) => (
                          <button
                            className="rounded-full border border-[var(--border-muted)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent-gold-border)] hover:text-[var(--accent-gold-text)]"
                            key={example}
                            onClick={() => setInput(example)}
                            type="button"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      onSaveDuplicateAnyway={saveDuplicateAnyway}
                      onUndo={(transactionId) => undoTransactionMutation.mutate(transactionId)}
                      undoPending={undoTransactionMutation.isPending}
                    />
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
                    disabled={chatMutation.isPending}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="4500 café, +300k sueldo..."
                    type="text"
                    value={input}
                  />
                  <button className={`${ui.buttonBase} ${ui.buttonSolidGold}`} disabled={chatMutation.isPending || !input.trim()} type="submit">
                    {chatMutation.isPending ? "Guardando..." : "Enviar"}
                  </button>
                  <button className={`${ui.buttonBase} ${ui.buttonNeutral}`} onClick={() => setShowTransactionModal(true)} type="button">
                    Manual
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
        {showTransactionModal ? (
          <CreateTransactionModal
            accounts={accounts}
            categories={categories}
            error={createTransactionMutation.error ? (createTransactionMutation.error as Error).message : null}
            isLoading={createTransactionMutation.isPending}
            onClose={() => setShowTransactionModal(false)}
            onSubmit={(data) => createTransactionMutation.mutate(data)}
          />
        ) : null}
      </main>
    </div>
  );
}

function ChatBubble({
  message,
  onSaveDuplicateAnyway,
  onUndo,
  undoPending,
}: {
  message: ChatMessage;
  onSaveDuplicateAnyway: () => void;
  onUndo: (transactionId: string) => void;
  undoPending: boolean;
}) {
  if (message.role === "receipt" && message.transaction) {
    return (
      <div className="max-w-[92%] rounded-3xl border border-[var(--state-success-border)] bg-[var(--state-success-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
        <p className="font-semibold">Guardado: {formatReceiptAmount(message.transaction)}</p>
        <p className={`mt-1 ${ui.textMuted}`}>{formatReceiptDetails(message.transaction)}</p>
        {message.warnings?.map((warning) => <p className="mt-2 text-xs text-[var(--accent-info)]" key={warning}>{warning}</p>)}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className={`${ui.buttonBase} ${ui.buttonGold} text-xs`} href={`/accounts/${message.transaction.accountId}`}>Ver</Link>
          <button
            className={`${ui.buttonBase} ${ui.buttonNeutral} text-xs`}
            disabled={undoPending || message.undone}
            onClick={() => onUndo(message.transaction!.transactionId)}
            type="button"
          >
            {message.undone ? "Deshecha" : "Deshacer"}
          </button>
        </div>
      </div>
    );
  }

  if (message.role === "warning" && message.preview) {
    return (
      <div className="max-w-[92%] rounded-3xl border border-[var(--accent-info-border)] bg-[var(--accent-info-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
        <p className="font-semibold">{message.content}</p>
        <p className={`mt-1 ${ui.textMuted}`}>{formatPreviewDetails(message.preview)}</p>
        {message.warnings?.map((warning) => <p className="mt-2 text-xs text-[var(--accent-info)]" key={warning}>{warning}</p>)}
        <button className={`mt-3 ${ui.buttonBase} ${ui.buttonSolidGold} text-xs`} onClick={onSaveDuplicateAnyway} type="button">
          Guardar igual
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${message.role === "user" ? "ml-auto bg-[var(--accent-gold-soft)] text-[var(--accent-gold-text)]" : "bg-[var(--surface-1)] text-[var(--text-primary)]"}`}>
      {message.content}
    </div>
  );
}

function formatReceiptAmount(transaction: AssistantSavedTransaction) {
  return `${transaction.currency} ${formatNumber(transaction.amount)}`;
}

function formatReceiptDetails(transaction: AssistantSavedTransaction) {
  const category = transaction.categoryName ?? "Sin categorizar";
  const description = transaction.description || "Movimiento";
  return `${description} · ${transaction.accountName} · ${category} · ${formatShortDate(transaction.transactionDate)}`;
}

function formatPreviewDetails(preview: AssistantTransactionPreview) {
  const category = preview.categoryName ?? "Sin categorizar";
  const description = preview.description || "Movimiento";
  return `${preview.currency} ${formatNumber(preview.amount)} · ${description} · ${preview.accountName} · ${category}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function DisabledState({ showMenu, setShowMenu }: { showMenu: boolean; setShowMenu: (show: boolean) => void }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 xl:pl-32 2xl:pl-80 ${ui.page}`}>
        <section className={ui.panel}>
          <h1 className={`text-2xl font-semibold ${ui.textPrimary}`}>Asistente desactivado</h1>
          <p className={`mt-2 ${ui.textMuted}`}>Funcionalidad desactivada por configuración.</p>
        </section>
      </main>
    </div>
  );
}
