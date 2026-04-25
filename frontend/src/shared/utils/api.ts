import { API_BASE } from "./apiBase";

export interface ApiError {
  status: number;
  detail: string;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const url = `${API_BASE}${path}`;
  let res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // On 401, try refreshing the token once via cookie-based refresh
  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } else {
      throw { status: 401, detail: "Session expired. Please log in again." } satisfies ApiError;
    }
  }

  if (!res.ok) {
    let detail = "Something went wrong";
    try {
      const errBody = await res.json() as { detail?: unknown };
      if (Array.isArray(errBody.detail)) {
        const first = (errBody.detail as { msg?: string }[])[0];
        detail = first?.msg ?? "Validation error";
      } else if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      }
    } catch { /* non-JSON error body */ }
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
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
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
