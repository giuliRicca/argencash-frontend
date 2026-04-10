"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { requestJson } from "@/lib/api";
import { normalizeAccessToken } from "@/lib/auth-token";
import { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/contracts";
import { persistToken } from "@/lib/storage";
import { ui } from "@/lib/ui";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(150, "Full name is too long."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthWorkspace() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginRequest) =>
      requestJson<AuthResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: (response) => {
      persistToken(normalizeAccessToken(response.accessToken));
      loginForm.reset();
      router.push("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterRequest) =>
      requestJson<AuthResponse>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: (response) => {
      persistToken(normalizeAccessToken(response.accessToken));
      registerForm.reset();
      router.push("/dashboard");
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="w-full rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-hero)] sm:p-8">
        <div className="mb-6 flex rounded-full border border-[var(--border-muted)] bg-[var(--surface-2)] p-1 text-sm">
          <ModeButton active={mode === "login"} onClick={() => setMode("login")}>Sign in</ModeButton>
          <ModeButton active={mode === "register"} onClick={() => setMode("register")}>Register</ModeButton>
        </div>

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <Heading title="Sign in" />
            <Field label="Email" error={loginForm.formState.errors.email?.message}>
              <input className={inputClassName} placeholder="email@example.com" {...loginForm.register("email")} />
            </Field>
            <Field label="Password" error={loginForm.formState.errors.password?.message}>
              <input className={inputClassName} type="password" placeholder="StrongPass123!" {...loginForm.register("password")} />
            </Field>
            <button className={primaryButtonClassName} disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
            {loginMutation.error ? <InlineError message={loginMutation.error.message} /> : null}
          </form>
        ) : (
          <form className="space-y-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
            <Heading title="Register" />
            <Field label="Full name" error={registerForm.formState.errors.fullName?.message}>
              <input className={inputClassName} placeholder="John Doe" {...registerForm.register("fullName")} />
            </Field>
            <Field label="Email" error={registerForm.formState.errors.email?.message}>
              <input className={inputClassName} placeholder="email@example.com" {...registerForm.register("email")} />
            </Field>
            <Field label="Password" error={registerForm.formState.errors.password?.message}>
              <input className={inputClassName} type="password" placeholder="StrongPass123!" {...registerForm.register("password")} />
            </Field>
            <button className={primaryButtonClassName} disabled={registerMutation.isPending} type="submit">
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </button>
            {registerMutation.error ? <InlineError message={registerMutation.error.message} /> : null}
          </form>
        )}
      </section>
    </div>
  );
}

function Heading({ title }: { title: string }) {
  return <h1 className={`mb-2 text-3xl font-semibold ${ui.textPrimary}`}>{title}</h1>;
}

function ModeButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={active ? "flex-1 rounded-full bg-[var(--accent-gold)] px-4 py-2 font-medium text-[var(--accent-gold-ink)]" : "flex-1 rounded-full px-4 py-2 font-medium text-[var(--text-secondary)]"}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${ui.textPrimary}`}>{label}</span>
      {children}
      {error ? <p className={`mt-2 text-sm ${ui.textExpense}`}>{error}</p> : null}
    </label>
  );
}

function InlineError({ message }: { message: string }) {
  return <p className={ui.errorBanner}>{message}</p>;
}

const inputClassName =
  "w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--state-success-border)] focus:ring-2 focus:ring-[var(--state-success-soft)]";

const primaryButtonClassName =
  "w-full rounded-2xl bg-[var(--accent-gold)] px-4 py-3 font-medium text-[var(--accent-gold-ink)] transition hover:bg-[var(--accent-gold-hover)] disabled:cursor-not-allowed disabled:opacity-60";
