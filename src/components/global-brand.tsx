"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { useStoredToken } from "@/lib/storage";

const securedPathPrefixes = ["/dashboard", "/settings", "/accounts"];
const hiddenBrandPaths = new Set(["/", "/login", "/register"]);

export function GlobalBrand() {
  const pathname = usePathname();
  const accessToken = useStoredToken();

  const isSecuredPath = securedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (hiddenBrandPaths.has(pathname) || (isSecuredPath && !accessToken)) {
    return null;
  }

  return (
    <div className="px-6 pt-5 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl items-center">
        {pathname === "/dashboard" ? (
          <span aria-label="ArgenCash" className="inline-block rounded-xl">
            <BrandLogo className="hidden text-2xl xl:block" />
            <BrandLogo className="text-2xl xl:hidden" compact />
          </span>
        ) : (
          <Link aria-label="Go to dashboard" className="inline-block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)]" href="/dashboard" prefetch={false}>
            <BrandLogo className="hidden text-2xl xl:block" />
            <BrandLogo className="text-2xl xl:hidden" compact />
          </Link>
        )}
      </div>
    </div>
  );
}
