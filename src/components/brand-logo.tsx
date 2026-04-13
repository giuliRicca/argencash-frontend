type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <div className={`text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl ${className}`.trim()}>
      {compact ? (
        <>
          <span>A</span>
          <span className="text-[var(--accent-gold)]">C</span>
        </>
      ) : (
        <>
          <span>Argen</span>
          <span className="text-[var(--accent-gold)]">Cash</span>
        </>
      )}
    </div>
  );
}
