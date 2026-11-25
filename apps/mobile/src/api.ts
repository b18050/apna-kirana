export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${cleanBase}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
