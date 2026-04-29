"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ui } from "@/lib/ui";
import { useStoredToken } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const accessToken = useStoredToken();

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);

  if (accessToken) {
    return null;
  }

  return (
    <main className={`${ui.page} relative pt-10 sm:pt-12 lg:pt-14`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <section className="fade-up-enter rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-panel)] sm:p-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BrandLogo className="text-5xl sm:text-6xl" />
              <span className="rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent-gold-text)]">
                Finanzas personales, sin ruido
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className={`text-3xl font-semibold leading-tight sm:text-4xl ${ui.textPrimary}`}>
                Controla tu plata en ARS y USD desde un solo lugar.
              </h1>
              <p className={`mt-4 text-base sm:text-lg ${ui.textSecondary}`}>
                ArgenCash te ayuda a registrar gastos, mover saldos y ver el valor real de tu portfolio con cotizaciones actualizadas.
              </p>
              <p className={`mt-3 max-w-2xl text-sm sm:text-base ${ui.textSecondary}`}>
                En Argentina, inflación y tipos de cambio paralelos vuelven difícil entender tu saldo real. ArgenCash centraliza cuentas,
                movimientos y referencias de tipo de cambio para decidir con claridad.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} !text-[var(--accent-gold-ink)] px-6 py-3`} href="/register" prefetch={false}>
                Crear cuenta
              </Link>
              <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonNeutral} px-6 py-3`} href="/login" prefetch={false}>
                Ingresar
              </Link>
            </div>
          </div>
        </section>

        <section className="fade-up-enter-delay-1 grid gap-3 sm:grid-cols-3">
          {trustPoints.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] px-4 py-4 sm:px-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="fade-up-enter-delay-2 rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Por qué ArgenCash</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {problemPoints.map((point) => (
              <li key={point} className={`rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-3)] px-4 py-3 text-sm ${ui.textSecondary}`}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="fade-up-enter-delay-2 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className={ui.tile}>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{feature.kicker}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h2>
              <p className={`mt-2 text-sm ${ui.textSecondary}`}>{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="fade-up-enter-delay-2 rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Listo para empezar</p>
              <p className={`mt-2 text-xl font-semibold ${ui.textPrimary}`}>Empezá a controlar ARS y USD con claridad.</p>
            </div>
            <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} !text-[var(--accent-gold-ink)] px-6 py-3`} href="/register" prefetch={false}>
              Empezar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const trustPoints = [
  { label: "Cotizaciones", value: "Referencias oficial, blue, CCL y crypto" },
  { label: "Multi-cuenta", value: "Saldos por moneda en una sola vista" },
  { label: "Control diario", value: "Ingresos, gastos, transferencias y presupuestos" },
];

const features = [
  {
    kicker: "Portfolio",
    title: "Mira tu total real de un vistazo",
    description: "Seguí saldos nativos y convertidos para entender tu exposición al instante.",
  },
  {
    kicker: "Movimientos",
    title: "Registrá cada operación con contexto",
    description: "Mantené tus movimientos claros con ingresos, gastos y historial editable por categoría.",
  },
  {
    kicker: "Decisiones",
    title: "Actuá con contexto cambiario",
    description: "Usa referencias de mercado al mover plata entre saldos ARS y USD.",
  },
];

const problemPoints = [
  "Los saldos quedan partidos entre cuentas y monedas.",
  "La volatilidad complica decisiones de todos los días.",
  "Muchas herramientas no muestran tu foto real ARS/USD.",
];
