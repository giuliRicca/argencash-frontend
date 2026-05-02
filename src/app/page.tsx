"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ui } from "@/lib/ui";
import { useStoredToken } from "@/lib/storage";

type FeatureMockup = "portfolio" | "quotes" | "movements" | "decisions";
type QuoteCurrency = "ARS" | "USD";

interface Feature {
  kicker: string;
  title: string;
  description: string;
  className: string;
  mockup: FeatureMockup;
}

const glassCard =
  "group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold-border)] hover:shadow-[0_24px_90px_rgba(219,201,163,0.12)] sm:p-6";

export default function Home() {
  const router = useRouter();
  const accessToken = useStoredToken();
  const [quoteCurrency, setQuoteCurrency] = useState<QuoteCurrency>("ARS");

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);

  if (accessToken) {
    return null;
  }

  return (
    <main className={`${ui.page} relative overflow-hidden pt-10 sm:pt-12 lg:pt-14`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-45">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(219,201,163,0.2),transparent_68%)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-[-10rem] top-[28rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(50,122,112,0.18),transparent_68%)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-18rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(219,201,163,0.13),transparent_70%)] blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 sm:gap-14">
        <section className="fade-up-enter relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(245,241,232,0.08),rgba(17,24,22,0.58)_42%,rgba(10,15,14,0.28))] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.32)] backdrop-blur-md sm:p-10 lg:p-12">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(219,201,163,0.18),transparent_66%)] blur-2xl" />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BrandLogo className="text-5xl sm:text-6xl" />
              <span className="rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent-gold-text)] shadow-[0_0_32px_rgba(219,201,163,0.1)]">
                Finanzas personales, sin ruido
              </span>
            </div>

            <div className="max-w-4xl">
              <h1 className={`text-4xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl ${ui.textPrimary}`}>
                Controla tu plata en ARS y USD desde un solo lugar.
              </h1>
              <p className={`mt-5 max-w-2xl text-base leading-7 sm:text-lg ${ui.textSecondary}`}>
                Portfolio, movimientos y tipo de cambio en una pantalla clara para decidir mejor cada día.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} !text-[var(--accent-gold-ink)] px-7 py-4 text-base shadow-[0_16px_48px_rgba(219,201,163,0.22)] hover:shadow-[0_20px_60px_rgba(219,201,163,0.3)]`} href="/register" prefetch={false}>
                Crear cuenta
              </Link>
              <Link className={`inline-flex justify-center ${ui.buttonBase} border border-white/10 bg-white/[0.03] px-6 py-4 text-[var(--text-secondary)] hover:border-white/20 hover:text-[var(--text-primary)]`} href="/login" prefetch={false}>
                Ingresar
              </Link>
            </div>
          </div>
        </section>

        <section className="fade-up-enter-delay-1 grid gap-3 sm:grid-cols-3">
          {trustPoints.map((item) => (
            <article key={item.label} className="rounded-full border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="fade-up-enter-delay-2 py-4 sm:py-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-gold-text)]">Por qué ArgenCash</p>
            <h2 className={`mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-4xl ${ui.textPrimary}`}>
              Tu foto financiera sin ruido cambiario.
            </h2>
          </div>
          <ul className="mt-7 grid gap-5 sm:grid-cols-3">
            {problemPoints.map((point) => (
              <li key={point} className={`flex gap-3 text-sm leading-6 ${ui.textSecondary}`}>
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-gold)] shadow-[0_0_24px_rgba(219,201,163,0.5)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="fade-up-enter-delay-2 grid auto-rows-[minmax(16rem,auto)] gap-4 md:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className={`${glassCard} ${feature.className}`}>
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(219,201,163,0.13),transparent_34%)] opacity-80" />
              <div className="relative flex h-full flex-col gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{feature.kicker}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{feature.title}</h2>
                  <p className={`mt-2 max-w-sm text-sm leading-6 ${ui.textSecondary}`}>{feature.description}</p>
                </div>
                <FeatureMockup kind={feature.mockup} quoteCurrency={quoteCurrency} onQuoteCurrencyChange={setQuoteCurrency} />
              </div>
            </article>
          ))}
        </section>

        <section className="fade-up-enter-delay-2 relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-md sm:px-10 sm:py-14">
          <div aria-hidden className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(50,122,112,0.28),transparent_68%)] blur-3xl" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Listo para empezar</p>
            <h2 className={`text-3xl font-semibold tracking-[-0.04em] sm:text-5xl ${ui.textPrimary}`}>
              Empezá a controlar ARS y USD con claridad.
            </h2>
            <Link className={`inline-flex justify-center ${ui.buttonBase} ${ui.buttonSolidGold} !text-[var(--accent-gold-ink)] px-8 py-4 text-base shadow-[0_18px_56px_rgba(219,201,163,0.24)]`} href="/register" prefetch={false}>
              Empezar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const trustPoints = [
  { label: "Tipo de cambio", value: "Oficial, blue, CCL y crypto" },
  { label: "Multi-cuenta", value: "ARS y USD en una vista" },
  { label: "Control diario", value: "Gastos, ingresos y transferencias" },
];

const features: Feature[] = [
  {
    kicker: "Portfolio",
    title: "Tu plata real, al instante.",
    description: "ARS, USD y equivalencias en una vista.",
    className: "md:col-span-2 md:row-span-2",
    mockup: "portfolio",
  },
  {
    kicker: "Tipo de cambio",
    title: "Convertí con referencia real.",
    description: "ARS y USD con mercado a la vista.",
    className: "md:col-span-2",
    mockup: "quotes",
  },
  {
    kicker: "Movimientos",
    title: "Cada gasto con contexto.",
    description: "Categorías, cuentas y moneda sin fricción.",
    className: "md:col-span-1",
    mockup: "movements",
  },
  {
    kicker: "Decisiones",
    title: "Mover plata con señal.",
    description: "Compará saldos antes de convertir.",
    className: "md:col-span-1",
    mockup: "decisions",
  },
];

const problemPoints = [
  "Los saldos quedan partidos entre cuentas y monedas.",
  "La volatilidad complica decisiones de todos los días.",
  "Muchas herramientas no muestran tu foto real ARS/USD.",
];

function FeatureMockup({
  kind,
  quoteCurrency,
  onQuoteCurrencyChange,
}: {
  kind: FeatureMockup;
  quoteCurrency: QuoteCurrency;
  onQuoteCurrencyChange: (currency: QuoteCurrency) => void;
}) {
  if (kind === "portfolio") {
    return (
      <div aria-hidden className="flex-1 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Total real</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">$ 2.84M</p>
          </div>
          <span className="rounded-full border border-[var(--state-success-border)] bg-[var(--state-success-soft)] px-3 py-1 text-xs text-[var(--state-success)]">+4.8%</span>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] p-3 text-[var(--text-secondary)]">ARS <span className="block text-[var(--text-primary)]">$ 1.12M</span></div>
          <div className="rounded-2xl bg-white/[0.04] p-3 text-[var(--text-secondary)]">USD <span className="block text-[var(--text-primary)]">US$ 1,945</span></div>
          <div className="rounded-2xl bg-[var(--accent-gold-soft)] p-3 text-[var(--accent-gold-text)]">Dólar mix <span className="block text-[var(--text-primary)]">$ 1.188</span></div>
        </div>
        <div className="mt-6 flex h-28 items-end gap-2">
          {[44, 58, 40, 76, 64, 92, 82].map((height) => (
            <div key={height} className="flex-1 rounded-t-xl bg-[linear-gradient(180deg,rgba(219,201,163,0.88),rgba(219,201,163,0.14))]" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === "quotes") {
    const rows = quoteRowsByCurrency[quoteCurrency];

    return (
      <div className="mt-auto rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-xs text-[var(--text-muted)]" aria-label="Elegir moneda base">
            {quoteCurrencies.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => onQuoteCurrencyChange(currency)}
                className={`rounded-full px-3 py-1 font-medium transition ${quoteCurrency === currency ? "bg-[var(--accent-gold)] text-[var(--accent-gold-ink)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                aria-pressed={quoteCurrency === currency}
              >
                {currency}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">{quoteCurrency === "ARS" ? "$100.000 a USD" : "US$100 a ARS"}</p>
        </div>
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between border-t border-white/10 py-3 text-sm">
            <span className="text-[var(--text-secondary)]">{row.name}</span>
            <span className="font-medium text-[var(--text-primary)]">{row.value}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "movements") {
    return (
      <div aria-hidden className="mt-auto space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
        {movementRows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-3 text-sm">
            <span className="text-[var(--text-secondary)]">{row.name}</span>
            <span className={row.amount.startsWith("+") ? "text-[var(--state-success)]" : "text-[var(--state-danger)]"}>{row.amount}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden className="mt-auto rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 text-sm text-[var(--text-secondary)]">
        <span>$ 185.000</span>
        <span className="text-[var(--accent-gold-text)]">ARS</span>
      </div>
      <div className="mx-auto my-3 h-8 w-px bg-[var(--accent-gold-border)]" />
      <div className="flex items-center justify-between rounded-2xl bg-[var(--accent-gold-soft)] p-3 text-sm text-[var(--accent-gold-text)]">
        <span>US$ 152</span>
        <span>Blue</span>
      </div>
    </div>
  );
}

const quoteCurrencies: QuoteCurrency[] = ["ARS", "USD"];

const quoteRowsByCurrency: Record<QuoteCurrency, { name: string; value: string }[]> = {
  ARS: [
    { name: "Oficial", value: "US$ 98.81" },
    { name: "Blue", value: "US$ 82.30" },
    { name: "CCL", value: "US$ 84.18" },
  ],
  USD: [
    { name: "Oficial", value: "$ 101.200" },
    { name: "Blue", value: "$ 121.500" },
    { name: "CCL", value: "$ 118.800" },
  ],
};

const movementRows = [
  { name: "Sueldo", amount: "+$ 980k" },
  { name: "Alquiler", amount: "-$ 310k" },
  { name: "USD ahorro", amount: "-US$ 200" },
];
