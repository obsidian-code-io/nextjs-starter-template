"use client";

/**
 * Clears all cookies by setting them to expire in the past
 */
export function clearAllCookies() {
  if (typeof window === "undefined") return;

  // Get all cookies
  const cookies = document.cookie.split(";");

  // Clear each cookie
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

    // Set cookie to expire in the past for all possible paths
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  });
}

/**
 * Clears all localStorage items
 */
export function clearAllLocalStorage() {
  if (typeof window === "undefined") return;
  localStorage.clear();
}

/**
 * Clears all sessionStorage items
 */
export function clearAllSessionStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.clear();
}

/**
 * Clears all Zustand persisted stores from localStorage
 */
export function clearZustandStores() {
  if (typeof window === "undefined") return;

  // List of known Zustand store keys
  const zustandStoreKeys = [
    "auth-storage",
    "user-storage",
    "organization-storage",
  ];

  zustandStoreKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Clears all client-side storage (cookies, localStorage, sessionStorage, Zustand stores)
 */
export function clearAllStorage() {
  clearAllCookies();
  clearAllLocalStorage();
  clearAllSessionStorage();
  clearZustandStores();
}

/**
 * Handles 401 unauthorized response
 * Clears all storage and redirects to login (unless already on auth page)
 */
export function handle401Unauthorized() {
  if (typeof window === "undefined") return;

  // Don't redirect if already on an auth page (prevents redirect loops)
  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath === "/forgot-password";

  // Clear all storage (cookies, localStorage, sessionStorage, Zustand stores)
  clearAllStorage();

  // Only redirect if not already on an auth page
  if (!isAuthPage) {
    window.location.href = "/login";
  }
}
