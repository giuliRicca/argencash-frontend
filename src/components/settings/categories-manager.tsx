"use client";

import { useMemo, useState } from "react";

import { Category, CreateCategoryRequest } from "@/lib/contracts";
import { ui } from "@/lib/ui";

type CategoriesManagerProps = {
  categories: Category[];
  isCreating: boolean;
  onCreateCategory: (data: CreateCategoryRequest) => void;
};

export function CategoriesManager({ categories, isCreating, onCreateCategory }: CategoriesManagerProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  const expenseCategories = useMemo(() => categories.filter((category) => category.type === "EXPENSE"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((category) => category.type === "INCOME"), [categories]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreateCategory({ name: name.trim(), type });
    setName("");
  };

  return (
    <section className={ui.panel}>
      <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Categories</h2>

      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={`flex-1 ${ui.input}`}
            onChange={(event) => setName(event.target.value)}
            placeholder="Category name"
            required
            type="text"
            value={name}
          />
          <select
            className={ui.input}
            onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}
            value={type}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <button
            className={`${ui.buttonBase} ${ui.buttonSolidGold} rounded-2xl px-4 py-3`}
            disabled={isCreating || name.trim().length === 0}
            type="submit"
          >
            {isCreating ? "Creating..." : "Add"}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <CategoryColumn categories={expenseCategories} title="Expenses" />
        <CategoryColumn categories={incomeCategories} title="Incomes" />
      </div>
    </section>
  );
}

function CategoryColumn({ title, categories }: { title: string; categories: Category[] }) {
  return (
    <div>
      <h3 className={`mb-3 text-sm font-medium ${ui.textMuted}`}>{title}</h3>
      <div className="grid gap-2">
        {categories.length === 0 ? <p className={`text-sm ${ui.textMuted}`}>No categories.</p> : null}
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--surface-2)] px-4 py-3"
          >
            <span className={`text-sm ${ui.textPrimary}`}>{category.name}</span>
            <span className={`text-xs ${ui.textMuted}`}>{category.isSystem ? "System" : "Custom"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
