const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const tokens = {
  get access() {
    return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(typeof data === 'string' ? data : 'Request failed');
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokens.set(data.access, data.refresh);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
        ...headers,
      },
      cache: 'no-store',
    });

  let res = await doFetch();

  // Expired access token: try to refresh. If the session is over, sign the user out.
  if (res.status === 401 && auth && tokens.refresh) {
    if (await refreshAccessToken()) {
      res = await doFetch();
    } else {
      tokens.clear();
      if (typeof window !== 'undefined') window.location.href = '/signin';
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// DRF may return a plain array or a paginated { results: [] }
export function unwrap<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}