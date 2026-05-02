"use client";

import { useMemo, useState } from "react";

import type { Budget, Category, CreateBudgetRequest, CreateCategoryRequest, UpdateBudgetRequest } from "@/lib/contracts";
import { formatAmountInput, normalizeAmountInput, parseAmountInput } from "@/lib/amount-input";
import { formatSystemLabel } from "@/lib/labels";
import { ui } from "@/lib/ui";

type CategoriesManagerProps = {
  categories: Category[];
  budgets: Budget[];
  isCreating: boolean;
  isSavingBudget: boolean;
  isDeletingBudget: boolean;
  onCreateCategory: (data: CreateCategoryRequest) => void;
  onCreateBudget: (data: CreateBudgetRequest) => void;
  onUpdateBudget: (budgetId: string, data: UpdateBudgetRequest) => void;
  onDeleteBudget: (budgetId: string) => void;
};

type BudgetDraft = {
  amount: string;
  currency: "USD" | "ARS";
  budgetId: string | null;
};

export function CategoriesManager({
  categories,
  budgets,
  isCreating,
  isSavingBudget,
  isDeletingBudget,
  onCreateCategory,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}: CategoriesManagerProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, BudgetDraft>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const expenseCategories = useMemo(() => categories.filter((category) => category.type === "EXPENSE"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((category) => category.type === "INCOME"), [categories]);

  const baseBudgetDrafts = useMemo(() => {
    const budgetsByCategoryId = new Map(budgets.map((budget) => [budget.categoryId, budget]));
    const nextDrafts: Record<string, BudgetDraft> = {};

    for (const category of expenseCategories) {
      const budget = budgetsByCategoryId.get(category.id);
      nextDrafts[category.id] = {
        amount: budget ? String(budget.amount) : "",
        currency: budget?.currency ?? "USD",
        budgetId: budget?.id ?? null,
      };
    }

    return nextDrafts;
  }, [budgets, expenseCategories]);

  const getDraft = (categoryId: string): BudgetDraft => {
    const localDraft = budgetDrafts[categoryId];
    const baseDraft = baseBudgetDrafts[categoryId];

    return {
      amount: localDraft?.amount ?? baseDraft?.amount ?? "",
      currency: localDraft?.currency ?? baseDraft?.currency ?? "USD",
      budgetId: localDraft?.budgetId ?? baseDraft?.budgetId ?? null,
    };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreateCategory({ name: name.trim(), type });
    setName("");
  };

  const updateDraft = (categoryId: string, nextDraft: Partial<BudgetDraft>) => {
    const currentDraft = getDraft(categoryId);

    setBudgetDrafts((current) => ({
      ...current,
      [categoryId]: {
        amount: currentDraft.amount,
        currency: currentDraft.currency,
        budgetId: currentDraft.budgetId,
        ...nextDraft,
      },
    }));
  };

  const saveBudget = (categoryId: string) => {
    const draft = getDraft(categoryId);
    if (!draft) {
      return;
    }

    const amount = parseAmountInput(draft.amount);
    if (amount <= 0) {
      return;
    }

    const payload = {
      categoryId,
      amount,
      currency: draft.currency,
    } as const;

    if (draft.budgetId) {
      onUpdateBudget(draft.budgetId, payload);
      setEditingCategoryId(null);
      return;
    }

    onCreateBudget(payload);
    setEditingCategoryId(null);
  };

  const removeBudget = (categoryId: string) => {
    const draft = getDraft(categoryId);
    if (!draft.budgetId) {
      return;
    }

    onDeleteBudget(draft.budgetId);
    setEditingCategoryId(null);
  };

  return (
    <section className={`${ui.panel} fade-up-enter-delay-2`} id="budgets">
      <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Categorías</h2>
      <p className={`mt-2 text-sm ${ui.textMuted}`}>Configurá presupuestos mensuales para categorías de gasto.</p>

      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={`flex-1 ${ui.input}`}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de categoría"
            required
            type="text"
            value={name}
          />
          <select
            className={ui.input}
            onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}
            value={type}
          >
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
          <button
            className={`${ui.buttonBase} ${ui.buttonSolidGold} rounded-2xl px-4 py-3`}
            disabled={isCreating || name.trim().length === 0}
            type="submit"
          >
            {isCreating ? "Creando..." : "Agregar"}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <CategoryColumn
          categories={expenseCategories}
          isDeletingBudget={isDeletingBudget}
          editingCategoryId={editingCategoryId}
          isSavingBudget={isSavingBudget}
          onDeleteBudget={removeBudget}
          onEditCategory={(categoryId) => setEditingCategoryId(categoryId)}
          onCancelEdit={() => setEditingCategoryId(null)}
          onSaveBudget={saveBudget}
          onUpdateDraft={updateDraft}
          showBudgetControls
          title="Gastos"
          budgetDrafts={budgetDrafts}
          getDraft={getDraft}
        />
        <CategoryColumn categories={incomeCategories} title="Ingresos" />
      </div>
    </section>
  );
}

function CategoryColumn({
  title,
  categories,
  budgetDrafts,
  getDraft,
  onUpdateDraft,
  onSaveBudget,
  onDeleteBudget,
  onEditCategory,
  onCancelEdit,
  editingCategoryId,
  isSavingBudget,
  isDeletingBudget,
  showBudgetControls = false,
}: {
  title: string;
  categories: Category[];
  budgetDrafts?: Record<string, BudgetDraft>;
  getDraft?: (categoryId: string) => BudgetDraft;
  onUpdateDraft?: (categoryId: string, nextDraft: Partial<BudgetDraft>) => void;
  onSaveBudget?: (categoryId: string) => void;
  onDeleteBudget?: (categoryId: string) => void;
  onEditCategory?: (categoryId: string) => void;
  onCancelEdit?: () => void;
  editingCategoryId?: string | null;
  isSavingBudget?: boolean;
  isDeletingBudget?: boolean;
  showBudgetControls?: boolean;
}) {
  return (
    <div>
      <h3 className={`mb-3 text-sm font-medium ${ui.textMuted}`}>{title}</h3>
      <div className="grid gap-2">
        {categories.length === 0 ? <p className={`text-sm ${ui.textMuted}`}>No hay categorías.</p> : null}
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--surface-2)] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
          >
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm ${ui.textPrimary}`}>{category.name}</p>
              <p className={`text-xs ${ui.textMuted}`}>{formatSystemLabel(category.isSystem)}</p>
            </div>
            {showBudgetControls && budgetDrafts && onUpdateDraft && onSaveBudget && getDraft ? (
              <div className="ml-3 min-w-[260px]">
                {editingCategoryId === category.id ? (
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <input
                        aria-label={`Monto de presupuesto para ${category.name}`}
                        className="w-28 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)]/75 focus-visible:border-[var(--state-success-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-success-soft)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        min="0"
                        inputMode="decimal"
                        onChange={(event) => onUpdateDraft(category.id, { amount: normalizeAmountInput(event.target.value) })}
                        placeholder="0.00"
                        step="0.01"
                        type="text"
                        value={formatAmountInput(getDraft(category.id).amount)}
                      />
                      <select
                        className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition focus-visible:border-[var(--state-success-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-success-soft)]"
                        onChange={(event) => onUpdateDraft(category.id, { currency: event.target.value as "USD" | "ARS" })}
                        value={getDraft(category.id).currency}
                      >
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                      <button
                        className={`${ui.buttonBase} ${ui.buttonSolidGold} rounded-xl px-3 py-2 text-xs`}
                        disabled={isSavingBudget || parseAmountInput(getDraft(category.id).amount) <= 0}
                        onClick={() => onSaveBudget(category.id)}
                        type="button"
                      >
                        {isSavingBudget ? "Guardando..." : getDraft(category.id).budgetId ? "Guardar" : "Definir"}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {getDraft(category.id).budgetId && onDeleteBudget ? (
                        <button
                          className={`${ui.buttonBase} rounded-xl border border-[var(--border-muted)] px-3 py-2 text-xs text-[var(--state-danger)]`}
                          disabled={isDeletingBudget}
                          onClick={() => onDeleteBudget(category.id)}
                          type="button"
                        >
                          Quitar presupuesto
                        </button>
                      ) : null}
                      {onCancelEdit ? (
                        <button
                          className={`${ui.buttonBase} rounded-xl border border-[var(--border-muted)] px-3 py-2 text-xs ${ui.textMuted}`}
                          onClick={onCancelEdit}
                          type="button"
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    {getDraft(category.id).budgetId ? (
                      <>
                        <span className={`text-xs ${ui.textMuted}`}>
                          {getDraft(category.id).currency} {formatAmountInput(getDraft(category.id).amount || "0")} / mes
                        </span>
                        <span className="rounded-full border border-[var(--state-success-border)] bg-[var(--state-success-soft)] px-2 py-1 text-[11px] font-medium text-[var(--state-success)]">
                          Presupuesto definido
                        </span>
                        {onEditCategory ? (
                          <button
                            className={`${ui.buttonBase} rounded-xl border border-[var(--border-muted)] px-3 py-2 text-xs`}
                            onClick={() => onEditCategory(category.id)}
                            type="button"
                          >
                            Editar
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className={`text-xs ${ui.textMuted}`}>Sin presupuesto</span>
                        {onEditCategory ? (
                          <button
                            className={`${ui.buttonBase} ${ui.buttonSolidGold} rounded-xl px-3 py-2 text-xs`}
                            onClick={() => onEditCategory(category.id)}
                            type="button"
                          >
                            Definir
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
