import { API_BASE } from "./apiBase";

const TOKEN_KEY = "idcard_token";
const REFRESH_KEY = "idcard_refresh_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export interface ApiError {
  status: number;
  detail: string;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  let res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // On 401, try refreshing the token once
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const tokens = await refreshRes.json() as { access_token: string; refresh_token: string };
        setTokens(tokens.access_token, tokens.refresh_token);
        headers["Authorization"] = `Bearer ${tokens.access_token}`;
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } else {
        clearTokens();
        throw { status: 401, detail: "Session expired. Please log in again." } satisfies ApiError;
      }
    }
  }

  if (!res.ok) {
    let detail = "Something went wrong";
    try {
      const errBody = await res.json() as { detail?: unknown };
      if (Array.isArray(errBody.detail)) {
        // Pydantic v2 validation errors — extract first human-readable message
        const first = (errBody.detail as { msg?: string }[])[0];
        detail = first?.msg ?? "Validation error";
      } else if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      }
    } catch { /* non-JSON error body */ }
    // Throw a real Error so Redux's miniSerializeError preserves the message
    throw Object.assign(new Error(detail), { status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/**
 * Upload a file using multipart/form-data.
 * Must NOT set Content-Type header — let the browser set it with the boundary.
 */
export async function uploadFile<T = unknown>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = "Upload failed";
    try {
      const errBody = await res.json() as { detail?: unknown };
      if (Array.isArray(errBody.detail)) {
        const first = (errBody.detail as { msg?: string }[])[0];
        detail = first?.msg ?? "Validation error";
      } else if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      }
    } catch { /* non-JSON */ }
    throw Object.assign(new Error(detail), { status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
