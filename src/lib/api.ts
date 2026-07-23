async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function get<T>(url: string) {
  return request<T>(url);
}

export function post<T>(url: string, body?: unknown) {
  return request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export function patch<T>(url: string, body: unknown) {
  return request<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function del<T>(url: string) {
  return request<T>(url, { method: "DELETE" });
}
