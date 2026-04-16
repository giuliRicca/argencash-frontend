import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { isUnauthorizedApiError } from "@/lib/api";
import { clearToken } from "@/lib/storage";

export function useUnauthorizedRedirect(errors: readonly unknown[]): void {
  const router = useRouter();
  const hasTriggeredUnauthorizedRedirectRef = useRef(false);
  const hasUnauthorizedError = errors.some(isUnauthorizedApiError);

  useEffect(() => {
    if (!hasUnauthorizedError || hasTriggeredUnauthorizedRedirectRef.current) {
      return;
    }

    hasTriggeredUnauthorizedRedirectRef.current = true;
    clearToken();
    router.replace("/unauthorized");
  }, [hasUnauthorizedError, router]);
}
