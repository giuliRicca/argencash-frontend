"use client";

import { useMemo, useState } from "react";

import { Category, CreateCategoryRequest } from "@/lib/contracts";

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
    <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
      <h2 className="text-2xl font-semibold text-stone-100">Categories</h2>

      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
            onChange={(event) => setName(event.target.value)}
            placeholder="Category name"
            required
            type="text"
            value={name}
          />
          <select
            className="rounded-2xl border border-[#56635b] bg-[#0f1412] px-4 py-3 text-stone-100 outline-none"
            onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}
            value={type}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <button
            className="rounded-2xl bg-[#dbc9a3] px-4 py-3 font-medium text-[#141915] transition hover:bg-[#e5d5b3] disabled:cursor-not-allowed disabled:opacity-70"
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
      <h3 className="mb-3 text-sm font-medium text-stone-400">{title}</h3>
      <div className="grid gap-2">
        {categories.length === 0 ? <p className="text-sm text-stone-500">No categories.</p> : null}
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-xl border border-[#313935] bg-[#0f1412] px-4 py-3"
          >
            <span className="text-sm text-stone-200">{category.name}</span>
            <span className="text-xs text-stone-500">{category.isSystem ? "System" : "Custom"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
