import { getAccessToken, refreshTokens } from "@/features/auth/auth";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // si hay body y no es FormData, set JSON
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`/api/v1${path}`, { ...init, headers });

  // si 401, intenta refresh 1 vez
  if (res.status === 401) {
    const ok = await refreshTokens();
    if (ok) {
      const token2 = getAccessToken();
      if (token2) headers.set("Authorization", `Bearer ${token2}`);
      res = await fetch(`/api/v1${path}`, { ...init, headers });
    }
  }

  return res;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = data?.detail || text || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return data as T;
}