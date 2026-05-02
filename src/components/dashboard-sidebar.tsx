"use client";

import Link from "next/link";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { assistantEnabled } from "@/lib/feature-flags";
import { clearToken } from "@/lib/storage";
import { ui } from "@/lib/ui";

const navItems = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Cuentas",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  ...(assistantEnabled
    ? [
        {
          href: "/assistant",
          label: "Registrar con IA",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 100 .75.375.375 0 000-.75zm0 0H8.25m4.125 0a.375.375 0 100 .75.375.375 0 000-.75zm0 0H12m4.125 0a.375.375 0 100 .75.375.375 0 000-.75zm0 0h-.375M21 12c0 4.142-4.03 7.5-9 7.5a9.77 9.77 0 01-3.29-.556L3 21l1.59-4.013C3.59 15.69 3 13.9 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5z" />
            </svg>
          ),
        },
      ]
    : []),
  {
    href: "/settings",
    label: "Configuración",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    onClose?.();
    clearToken();
    router.push("/");
  }, [onClose, router]);

  const containerClassName = mobile
    ? "fixed inset-0 z-50 flex flex-col bg-[var(--surface-1)] xl:hidden"
    : "hidden xl:fixed xl:inset-y-0 xl:z-40 xl:flex xl:w-20 2xl:w-64";

  const logoClassName = mobile
    ? "max-w-full overflow-hidden whitespace-nowrap text-3xl sm:text-3xl"
    : "max-w-full overflow-hidden whitespace-nowrap text-2xl 2xl:text-3xl";

  return (
    <aside className={containerClassName}>
      <div className="flex flex-col flex-1 min-h-0 border-r border-[var(--border-soft)] bg-[var(--surface-1)]">
        <div className={`flex items-center h-16 border-b border-[var(--border-soft)] ${mobile ? "justify-between px-4 sm:px-6" : "justify-center px-2 2xl:justify-start 2xl:px-6"}`}>
          <Link
            href="/dashboard"
            className={`rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] ${mobile ? "max-w-full" : "flex h-11 w-14 items-center justify-center overflow-hidden 2xl:h-auto 2xl:w-auto 2xl:justify-start"}`}
            onClick={() => onClose?.()}
          >
            {mobile ? (
              <BrandLogo className={logoClassName} compact />
            ) : (
              <>
                <span className="2xl:hidden">
                  <BrandLogo className={`${logoClassName} leading-none`} compact />
                </span>
                <span className="hidden 2xl:block">
                  <BrandLogo className={logoClassName} />
                </span>
              </>
            )}
          </Link>
          {mobile ? (
            <button
              aria-label="Cerrar menú"
              className="p-2 rounded-xl border border-[var(--border-strong)]"
              onClick={onClose}
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        <nav className="flex-1 px-2 2xl:px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors xl:justify-center 2xl:justify-start ${
                  isActive
                    ? "bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] border border-[var(--accent-gold-border)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] border border-transparent"
                }`}
              >
                {item.icon}
                <span className={mobile ? "inline" : "hidden 2xl:inline"}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 p-4 border-t border-[var(--border-soft)]">
          <button
            className={`${ui.buttonBase} ${ui.buttonNeutral} w-full justify-start text-left text-[var(--state-danger)] xl:justify-center 2xl:justify-start`}
            onClick={handleLogout}
            title="Log out"
            type="button"
          >
            <span className={mobile ? "inline" : "hidden 2xl:inline"}>Log out</span>
            <span className={mobile ? "hidden" : "inline 2xl:hidden"}>LO</span>
          </button>
          <div className={`rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-2)] p-3 ${ui.textMuted} ${mobile ? "" : "hidden 2xl:block"}`}>
            <p className="text-xs">ArgenCash v1.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
