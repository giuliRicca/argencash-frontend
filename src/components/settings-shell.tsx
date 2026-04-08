"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postJson, requestJson } from "@/lib/api";
import { buildAuthorizationHeader } from "@/lib/auth-token";
import { AuthenticatedUser, Category, CreateCategoryRequest } from "@/lib/contracts";
import { useStoredToken } from "@/lib/storage";
import { CategoriesManager } from "@/components/settings/categories-manager";

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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_50%,_#0b100f_100%)] px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/8 bg-[linear-gradient(145deg,_rgba(16,24,21,0.96),_rgba(20,31,27,0.88))] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:p-8">
          <Link className="text-sm text-stone-400 transition hover:text-stone-200" href="/dashboard">
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">Settings</h1>
          <p className="mt-3 text-stone-400">Manage categories and profile information.</p>
        </header>

        <section className="rounded-[2rem] border border-white/8 bg-[#131917]/92 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
          <h2 className="text-2xl font-semibold text-stone-100">Profile</h2>
          {meQuery.isLoading ? <p className="mt-4 text-sm text-stone-400">Loading profile...</p> : null}
          {meQuery.isError ? <ErrorBanner message="Profile could not be loaded." /> : null}
          {meQuery.data ? (
            <div className="mt-4 grid gap-3 text-sm text-stone-300">
              <p>
                <span className="text-stone-500">Name:</span> {meQuery.data.fullName}
              </p>
              <p>
                <span className="text-stone-500">Email:</span> {meQuery.data.email}
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

function MissingSessionState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_50%,_#0b100f_100%)] px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/8 bg-[#131917]/92 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
        <h1 className="text-3xl font-semibold text-stone-100">Sign in required</h1>
        <Link className="mt-6 inline-flex rounded-2xl bg-[#dbc9a3] px-5 py-3 font-medium text-[#141915] transition hover:bg-[#e5d5b3]" href="/">
          Back
        </Link>
      </div>
    </main>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <div className="rounded-3xl border border-[#313935] bg-[#0f1412] p-5 text-sm text-stone-400">{label}</div>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{message}</div>;
}
