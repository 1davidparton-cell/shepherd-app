// In production the API lives on a separate origin (shepherd-api) and must be an
// absolute URL — a blank VITE_API_URL makes auth links resolve to the SPA itself
// and blanks the sign-in page. Fall back to the prod backend when the env var is
// unset/empty; keep relative ('') in dev so Vite's proxy handles /api and /auth.
export const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://shepherd-api.vercel.app' : '');

export function getAuthToken(): string | null {
  return localStorage.getItem('shepherd_token');
}
export function setAuthToken(token: string): void {
  localStorage.setItem('shepherd_token', token);
}
export function clearAuthToken(): void {
  localStorage.removeItem('shepherd_token');
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
