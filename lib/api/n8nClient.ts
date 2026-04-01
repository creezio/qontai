export type N8nApiResponse<T> = {
  ok: boolean;
  data?: T;
  errors?: { code?: string; message: string; details?: unknown }[];
  nextActions?: { type: string; label?: string; href?: string; payload?: unknown }[];
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_N8N_BASE_URL || process.env.N8N_BASE_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

export class N8nError extends Error {
  constructor(
    message: string,
    public readonly response?: N8nApiResponse<unknown>,
    public readonly status?: number
  ) {
    super(message);
    this.name = "N8nError";
  }
}

export async function n8nFetch<T>(
  path: string,
  opts?: {
    method?: "GET" | "POST";
    token?: string | null;
    body?: unknown;
    signal?: AbortSignal;
  }
): Promise<N8nApiResponse<T>> {
  const base = getBaseUrl();
  if (!base) throw new N8nError("N8N base URL missing. Set NEXT_PUBLIC_N8N_BASE_URL.");

  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: opts?.method ?? "POST",
    headers: {
      "content-type": "application/json",
      ...(opts?.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts?.signal,
    cache: "no-store",
  });

  let json: N8nApiResponse<T> | null = null;
  try {
    json = (await res.json()) as N8nApiResponse<T>;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message ||
      `n8n request failed (${res.status} ${res.statusText})`;
    throw new N8nError(msg, json ?? undefined, res.status);
  }

  if (!json) throw new N8nError("n8n returned non-JSON response", undefined, res.status);
  return json;
}

