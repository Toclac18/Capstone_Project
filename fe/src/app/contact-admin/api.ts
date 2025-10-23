export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type ContactAdminResponse = {
  ticketId: string;
  ticketCode: string;
  status: string;
  message: string;
};

export async function postJSON<T>(
  path: string,
  payload: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : text || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
