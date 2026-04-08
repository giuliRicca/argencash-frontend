import { useSyncExternalStore } from "react";

import { normalizeAccessToken } from "@/lib/auth-token";

export const tokenStorageKey = "argencash.access-token";
const tokenChangedEvent = "argencash-token-changed";

export function persistToken(accessToken: string) {
  localStorage.setItem(tokenStorageKey, normalizeAccessToken(accessToken));
  window.dispatchEvent(new Event(tokenChangedEvent));
}

export function clearToken() {
  localStorage.removeItem(tokenStorageKey);
  window.dispatchEvent(new Event(tokenChangedEvent));
}

export function readStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(tokenStorageKey) ?? "";
}

export function useStoredToken() {
  return useSyncExternalStore(subscribeToTokenChanges, readStoredToken, () => "");
}

function subscribeToTokenChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onStoreChange();

  window.addEventListener("storage", handler);
  window.addEventListener(tokenChangedEvent, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(tokenChangedEvent, handler);
  };
}
