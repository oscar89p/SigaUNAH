import { getCsrfToken } from "@/services/csrf";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { message?: string } | undefined;
    throw new ApiError(response.status, body?.message ?? "No fue posible completar la solicitud");
  }

  return response.json() as Promise<T>;
}

export function get<T>(path: string, signal?: AbortSignal): Promise<T> { return request<T>(path, signal ? { signal } : undefined); }
export async function download(path: string): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: "include", headers: csrfHeaders() });
  if (!response.ok) { const body = await response.json().catch(() => undefined) as { message?: string } | undefined; throw new ApiError(response.status, body?.message ?? "No fue posible descargar el reporte"); }
  return response.blob();
}
export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), headers: csrfHeaders() });
}
export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body), headers: csrfHeaders() });
}
export function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body), headers: csrfHeaders() });
}

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "X-CSRF-Token": token } : {};
}
