// Auth module: receives the JWT issued by the Uptime Kuma OIDC callback,
// stores it, and attaches it to every API call. In dev mode (vite dev) this
// module is largely inert — RequireAuth bypasses the guard so the mock
// fixtures still render without a real backend.

const TOKEN_KEY = "pulse.jwt";

export function readTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (!token) return null;
  // Strip from URL bar so the token doesn't leak into bookmarks / referrers.
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function loginUrl(returnTo: string = window.location.pathname): string {
  // Sends the user through the existing OIDC flow on the same origin. The
  // server's allowlist (oidc-router.js) decides what `return` paths it honors.
  return `/auth/oidc/login?return=${encodeURIComponent(returnTo)}`;
}

// Shared fetch wrapper. Adds Authorization header when we have a token.
// On 401, clears the token and bounces to the OIDC login.
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = loginUrl();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
