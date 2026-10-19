import { api, tokens } from './client';

export type Role = 'CITIZEN' | 'STAFF' | 'DEPT_HEAD' | 'ADMIN';

export type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  role: Role;
  home_ward: string | null;
  sub_county: string | null;
  is_phone_verified: boolean;
};

// Accepts a phone number or an email address
export async function login(identifier: string, password: string): Promise<User> {
  const data = await api<{ access: string; refresh: string }>('/auth/login/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ identifier: normalizeIdentifier(identifier), password }),
  });
  tokens.set(data.access, data.refresh);
  return getMe();
}

export function register(input: {
  phone_number: string;
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) {
  return api<User>('/auth/register/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return api<User>('/auth/me/');
}

export function logout() {
  tokens.clear();
}

// ---------- Verification and password reset (no sign-in needed) ----------

const post = (path: string, body: object) =>
  api<{ detail: string }>(path, {
    method: 'POST',
    auth: false,
    body: JSON.stringify(body),
  });

// Sends a new verification code by email and SMS
export const sendVerification = (identifier: string) =>
  post('/auth/verify/send/', { identifier: normalizeIdentifier(identifier) });

// Confirms the 6-digit code (typed in, or taken from the email link)
export const confirmVerification = (identifier: string, code: string) =>
  post('/auth/verify/confirm/', { identifier: normalizeIdentifier(identifier), code });

// Sends a password reset code by email and SMS
export const forgotPassword = (identifier: string) =>
  post('/auth/password/forgot/', { identifier: normalizeIdentifier(identifier) });

export const resetPassword = (identifier: string, code: string, new_password: string) =>
  post('/auth/password/reset/', {
    identifier: normalizeIdentifier(identifier),
    code,
    new_password,
  });

// ---------- Helpers ----------

// Where each role lands after signing in
export function homeFor(role: Role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'STAFF' || role === 'DEPT_HEAD') return '/officer';
  return '/portal';
}

export function roleLabel(role: Role) {
  switch (role) {
    case 'ADMIN':
      return 'County Administrator';
    case 'DEPT_HEAD':
      return 'Department Head';
    case 'STAFF':
      return 'Officer';
    default:
      return 'Citizen';
  }
}

export function displayName(user: User) {
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return full || user.username;
}

export function initialsOf(user: User) {
  const parts = displayName(user).split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

// "+254712345678" or "0712 345 678" -> "0712345678" (the format stored in the backend)
export function normalizePhone(input: string) {
  const d = input.replace(/[\s-]/g, '');
  return d.startsWith('+254') ? '0' + d.slice(4) : d;
}

export const looksLikeEmail = (input: string) => input.includes('@');

// An email is only trimmed and lower-cased; anything else is treated as a phone number
export function normalizeIdentifier(input: string) {
  const v = input.trim();
  return looksLikeEmail(v) ? v.toLowerCase() : normalizePhone(v);
}

// DRF returns { field: ["message"] }; flatten it to { field: "message" }
export function fieldErrors(data: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return out;
}