// Password reset calls. Adjust API_BASE if your client uses a different env variable.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export class RecoveryError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, data: Record<string, unknown>) {
    super(`Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new RecoveryError(res.status, data);
  return data;
}

export const forgotPassword = (identifier: string) =>
  post('/api/auth/password/forgot/', { identifier });

export const resetPassword = (identifier: string, code: string, newPassword: string) =>
  post('/api/auth/password/reset/', { identifier, code, new_password: newPassword });

/** Pulls a readable message out of a backend error response. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof RecoveryError) {
    const d = err.data;
    if (typeof d.detail === 'string') return d.detail;
    const np = d.new_password;
    if (Array.isArray(np) && np.length) return String(np[0]);
  }
  return fallback;
}