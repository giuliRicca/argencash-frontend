"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { requestJson } from "@/lib/api";
import { normalizeAccessToken } from "@/lib/auth-token";
import type { AuthResponse, LoginRequest, RegistrationInitiateRequest, RegistrationInitiateResponse, ResendVerificationRequest } from "@/lib/contracts";
import { persistToken } from "@/lib/storage";
import { ui } from "@/lib/ui";
import { BrandLogo } from "@/components/brand-logo";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre completo es obligatorio.").max(150, "El nombre completo es demasiado largo."),
  email: z.email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type AuthWorkspaceProps = {
  initialMode?: "login" | "register";
};

export function AuthWorkspace({ initialMode = "login" }: AuthWorkspaceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "verification-sent">(initialMode);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

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

  const initiateRegisterMutation = useMutation({
    mutationFn: (values: RegistrationInitiateRequest) =>
      requestJson<RegistrationInitiateResponse>("/api/auth/register/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: (response, variables) => {
      setRegisteredEmail(variables.email);
      setMode("verification-sent");
    },
  });

  const resendMutation = useMutation({
    mutationFn: (values: ResendVerificationRequest) =>
      requestJson<RegistrationInitiateResponse>("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
  });

  const handleRegister = (values: RegisterValues) => {
    initiateRegisterMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  };

  const handleResend = () => {
    resendMutation.mutate({ email: registeredEmail });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="fade-up-enter w-full rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-hero)] sm:p-8">
        <div className="fade-up-enter-delay-1 mb-6 text-center">
          <BrandLogo className="text-4xl sm:text-5xl" />
        </div>

        {mode !== "verification-sent" && (
          <div className="fade-up-enter-delay-1 mb-6 flex rounded-full border border-[var(--border-muted)] bg-[var(--surface-2)] p-1 text-sm">
            <ModeButton active={mode === "login"} onClick={() => setMode("login")}>Ingresar</ModeButton>
            <ModeButton active={mode === "register"} onClick={() => setMode("register")}>Registrarse</ModeButton>
          </div>
        )}

        {mode === "login" ? (
          <form className="fade-up-enter-delay-2 space-y-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
            <Heading title="Ingresar" />
            <Field label="Email" error={loginForm.formState.errors.email?.message}>
              <input className={inputClassName} placeholder="email@example.com" {...loginForm.register("email")} />
            </Field>
            <Field label="Contraseña" error={loginForm.formState.errors.password?.message}>
              <input className={inputClassName} type="password" placeholder="StrongPass123!" {...loginForm.register("password")} />
            </Field>
            <button className={primaryButtonClassName} disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </button>
            {loginMutation.error ? <InlineError message={loginMutation.error.message} /> : null}
          </form>
        ) : mode === "register" ? (
          <form className="fade-up-enter-delay-2 space-y-4" onSubmit={registerForm.handleSubmit(handleRegister)}>
            <Heading title="Registrarse" />
            <Field label="Nombre completo" error={registerForm.formState.errors.fullName?.message}>
              <input className={inputClassName} placeholder="Juan Perez" {...registerForm.register("fullName")} />
            </Field>
            <Field label="Email" error={registerForm.formState.errors.email?.message}>
              <input className={inputClassName} placeholder="email@example.com" {...registerForm.register("email")} />
            </Field>
            <Field label="Contraseña" error={registerForm.formState.errors.password?.message}>
              <input className={inputClassName} type="password" placeholder="StrongPass123!" {...registerForm.register("password")} />
            </Field>
            <button className={primaryButtonClassName} disabled={initiateRegisterMutation.isPending} type="submit">
              {initiateRegisterMutation.isPending ? "Enviando verificación..." : "Crear cuenta"}
            </button>
            {initiateRegisterMutation.error ? <InlineError message={initiateRegisterMutation.error.message} /> : null}
          </form>
        ) : (
          <div className="fade-up-enter-delay-2 space-y-4">
            <Heading title="Revisa tu email" />
            <p className={ui.textSecondary}>
              Enviamos un enlace de verificación a <strong>{registeredEmail}</strong>.
            </p>
            <p className={ui.textSecondary}>
              Hace clic en el enlace del email para verificar tu cuenta y completar el registro.
            </p>
            <button
              className={secondaryButtonClassName}
              disabled={resendMutation.isPending}
              onClick={handleResend}
              type="button"
            >
              {resendMutation.isPending ? "Reenviando..." : "Reenviar email de verificación"}
            </button>
            <button
              className={tertiaryButtonClassName}
              onClick={() => setMode("register")}
              type="button"
            >
              Volver
            </button>
            {resendMutation.error ? <InlineError message={resendMutation.error.message} /> : null}
          </div>
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
      aria-pressed={active}
      className={active ? "flex-1 rounded-full bg-[var(--accent-gold)] px-4 py-2 font-medium text-[var(--accent-gold-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]" : "flex-1 rounded-full px-4 py-2 font-medium text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]"}
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
  `w-full ${ui.input}`;

const primaryButtonClassName =
  "w-full rounded-2xl bg-[var(--accent-gold)] px-4 py-3 font-medium text-[var(--accent-gold-ink)] transition hover:bg-[var(--accent-gold-hover)] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-3 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-60";

const tertiaryButtonClassName =
  "w-full rounded-2xl px-4 py-2 font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]";
