const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}
export function setTokens(access: string, refresh: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}
export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function refreshTokens(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  const res = await fetch(`/api/v1/auth/refresh?refresh_token=${encodeURIComponent(rt)}`, {
    method: "POST",
  });
  if (!res.ok) return false;

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}