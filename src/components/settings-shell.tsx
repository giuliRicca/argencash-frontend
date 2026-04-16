"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteRequest, postJson, putJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import {
  AuthenticatedUser,
  Budget,
  Category,
  CreateBudgetRequest,
  CreateCategoryRequest,
  UpdateBudgetRequest,
} from "@/lib/contracts";
import { useUnauthorizedRedirect } from "@/lib/hooks/use-unauthorized-redirect";
import { useStoredToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { CategoriesManager } from "@/components/settings/categories-manager";
import { MissingSessionState } from "@/components/missing-session-state";

export function SettingsShell() {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me", accessToken],
    queryFn: () =>
      requestJson<AuthenticatedUser>("/api/auth/me", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", accessToken],
    queryFn: () =>
      requestJson<Category[]>("/api/categories", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      postJson<{ id: string }>("/api/categories", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", accessToken] });
    },
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", accessToken],
    queryFn: () =>
      requestJson<Budget[]>("/api/budgets", {
        headers: {
          Authorization: buildAuthorizationHeader(accessToken),
        },
      }),
    enabled: Boolean(accessToken),
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data: CreateBudgetRequest) =>
      postJson<{ id: string }>("/api/budgets", data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", accessToken] });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ budgetId, data }: { budgetId: string; data: UpdateBudgetRequest }) =>
      putJson<void>(`/api/budgets/${budgetId}`, data, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", accessToken] });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId: string) =>
      deleteRequest(`/api/budgets/${budgetId}`, {
        headers: { Authorization: buildAuthorizationHeader(accessToken) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", accessToken] });
    },
  });

  useUnauthorizedRedirect([
    meQuery.error,
    categoriesQuery.error,
    budgetsQuery.error,
    createCategoryMutation.error,
    createBudgetMutation.error,
    updateBudgetMutation.error,
    deleteBudgetMutation.error,
  ]);

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <main className={ui.page}>
      <div className={ui.shellWide}>
        <header className={`${ui.panel} fade-up-enter-delay-1`}>
          <Link className={ui.linkMuted} href="/dashboard">
            ← Dashboard
          </Link>
          <h1 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>Settings</h1>
          <p className={`mt-3 ${ui.textMuted}`}>Manage categories and profile information.</p>
        </header>

        <section className={`${ui.panel} fade-up-enter-delay-1`}>
          <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Profile</h2>
          {meQuery.isLoading ? <p className={`mt-4 text-sm ${ui.textMuted}`}>Loading profile...</p> : null}
          {meQuery.isError ? <ErrorBanner message="Profile could not be loaded." /> : null}
          {meQuery.data ? (
            <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
              <p>
                <span className={ui.textMuted}>Name:</span> {meQuery.data.fullName}
              </p>
              <p>
                <span className={ui.textMuted}>Email:</span> {meQuery.data.email}
              </p>
            </div>
          ) : null}
        </section>

        {categoriesQuery.isLoading ? <LoadingCard label="Loading categories..." /> : null}
        {budgetsQuery.isLoading ? <LoadingCard label="Loading budgets..." /> : null}
        {categoriesQuery.isError ? <ErrorBanner message="Could not load categories." /> : null}
        {budgetsQuery.isError ? <ErrorBanner message="Could not load budgets." /> : null}
        {categoriesQuery.data && budgetsQuery.data ? (
          <CategoriesManager
            categories={categoriesQuery.data}
            budgets={budgetsQuery.data}
            isCreating={createCategoryMutation.isPending}
            isDeletingBudget={deleteBudgetMutation.isPending}
            isSavingBudget={createBudgetMutation.isPending || updateBudgetMutation.isPending}
            onCreateBudget={(data) => createBudgetMutation.mutate(data)}
            onCreateCategory={(data) => createCategoryMutation.mutate(data)}
            onDeleteBudget={(budgetId) => deleteBudgetMutation.mutate(budgetId)}
            onUpdateBudget={(budgetId, data) => updateBudgetMutation.mutate({ budgetId, data })}
          />
        ) : null}
        {createCategoryMutation.error ? <ErrorBanner message={(createCategoryMutation.error as Error).message} /> : null}
        {createBudgetMutation.error ? <ErrorBanner message={(createBudgetMutation.error as Error).message} /> : null}
        {updateBudgetMutation.error ? <ErrorBanner message={(updateBudgetMutation.error as Error).message} /> : null}
        {deleteBudgetMutation.error ? <ErrorBanner message={(deleteBudgetMutation.error as Error).message} /> : null}
      </div>
    </main>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <div className={`rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5 text-sm ${ui.textMuted}`}>{label}</div>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div className={ui.errorBanner}>{message}</div>;
}
