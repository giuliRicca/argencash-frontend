"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import { AuthenticatedUser, Category, CreateCategoryRequest } from "@/lib/contracts";
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

  if (!accessToken) {
    return <MissingSessionState />;
  }

  return (
    <main className={ui.page}>
      <div className={ui.shellWide}>
        <header className={ui.panel}>
          <Link className={`text-sm transition hover:text-[var(--text-secondary)] ${ui.textMuted}`} href="/dashboard">
            ← Dashboard
          </Link>
          <h1 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${ui.textPrimary}`}>Settings</h1>
          <p className={`mt-3 ${ui.textMuted}`}>Manage categories and profile information.</p>
        </header>

        <section className={ui.panel}>
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
        {categoriesQuery.isError ? <ErrorBanner message="Could not load categories." /> : null}
        {categoriesQuery.data ? (
          <CategoriesManager
            categories={categoriesQuery.data}
            isCreating={createCategoryMutation.isPending}
            onCreateCategory={(data) => createCategoryMutation.mutate(data)}
          />
        ) : null}
        {createCategoryMutation.error ? <ErrorBanner message={(createCategoryMutation.error as Error).message} /> : null}
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
