"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
import { ErrorBanner, LoadingCard } from "@/components/status-card";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export function SettingsShell() {
  const accessToken = useStoredToken();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

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
    <div className="flex min-h-screen">
      <DashboardSidebar />
      {showMenu ? <DashboardSidebar mobile onClose={() => setShowMenu(false)} /> : null}
      <main className={`flex-1 xl:pl-32 2xl:pl-80 ${ui.page}`}>
        <div className={ui.shellWide}>
          <header className={`${ui.panel} fade-up-enter-delay-1`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>Configuración</h1>
                <p className={`mt-3 ${ui.textMuted}`}>Administrá categorías e información de perfil.</p>
              </div>
              <button
                aria-label="Menu"
                className="p-2 rounded-xl border border-[var(--border-strong)] hover:border-[var(--border-strong-hover)] transition xl:hidden"
                onClick={() => setShowMenu(!showMenu)}
                type="button"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </header>

        <section className={`${ui.panel} fade-up-enter-delay-1`}>
          <h2 className={`text-2xl font-semibold ${ui.textPrimary}`}>Perfil</h2>
          {meQuery.isLoading ? <p className={`mt-4 text-sm ${ui.textMuted}`}>Cargando perfil...</p> : null}
          {meQuery.isError ? <ErrorBanner message="No se pudo cargar el perfil." /> : null}
          {meQuery.data ? (
            <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
              <p>
                <span className={ui.textMuted}>Nombre:</span> {meQuery.data.fullName}
              </p>
              <p>
                <span className={ui.textMuted}>Email:</span> {meQuery.data.email}
              </p>
            </div>
          ) : null}
        </section>

        {categoriesQuery.isLoading ? <LoadingCard label="Cargando categorías..." /> : null}
        {budgetsQuery.isLoading ? <LoadingCard label="Cargando presupuestos..." /> : null}
        {categoriesQuery.isError ? <ErrorBanner message="No se pudieron cargar las categorías." /> : null}
        {budgetsQuery.isError ? <ErrorBanner message="No se pudieron cargar los presupuestos." /> : null}
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
    </div>
  );
}

