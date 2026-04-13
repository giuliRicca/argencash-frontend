export const ui = {
  page: "min-h-screen bg-[var(--bg-page-gradient)] px-6 py-8 sm:px-10 lg:px-12",
  shellWide: "mx-auto flex w-full max-w-7xl flex-col gap-6",
  shellNarrow: "mx-auto flex w-full max-w-5xl flex-col gap-6",

  panel: "fade-up-enter rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-panel)] sm:p-8",
  heroPanel: "fade-up-enter flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-[var(--bg-hero-gradient)] p-6 shadow-[var(--shadow-hero)] sm:flex-row sm:items-start sm:justify-between sm:p-8",
  tile: "rounded-3xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-5",

  textMuted: "text-[var(--text-muted)]",
  textPrimary: "text-[var(--text-primary)]",

  input: "rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)]/75 focus-visible:border-[var(--state-success-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-success-soft)]",
  select: "rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] transition focus-visible:border-[var(--state-success-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-success-soft)]",

  buttonBase: "rounded-2xl px-4 py-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-70",
  linkMuted: "text-sm text-[var(--text-muted)] transition hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)]",
  buttonNeutral: "border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--border-strong-hover)]",
  buttonGold: "border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] text-[var(--accent-gold-text)] hover:bg-[color:rgba(219,201,163,0.16)]",
  buttonInfo: "border border-[var(--accent-info-border)] bg-[var(--accent-info-soft)] text-[var(--accent-info)] hover:bg-[color:rgba(90,111,149,0.2)]",
  buttonSolidGold: "bg-[var(--accent-gold)] text-[var(--accent-gold-ink)] hover:bg-[var(--accent-gold-hover)]",
  buttonDanger: "border border-[var(--state-danger-border)] text-[var(--state-danger)] hover:bg-[var(--state-danger-soft)]",

  badgeGold: "rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-gold)]",
  badgeSuccess: "rounded-full border border-[var(--state-success-border)] bg-[var(--state-success-soft)] px-3 py-1 text-sm font-medium text-[var(--state-success)]",
  badgeInfo: "rounded-full border border-[var(--accent-info-border)] bg-[var(--accent-info-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-info)]",

  textExpense: "text-[var(--state-danger)]",
  textIncome: "text-[var(--state-success)]",

  errorBanner: "rounded-3xl border border-[var(--state-danger-border)] bg-[var(--state-danger-soft)] px-5 py-4 text-sm text-[var(--state-danger)]",
};
