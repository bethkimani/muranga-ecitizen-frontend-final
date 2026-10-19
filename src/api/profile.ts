import { api } from '@/api/client';

export type ProfileInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export function updateProfile(data: ProfileInput) {
  return api('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) });
}

export function changePassword(data: { old_password: string; new_password: string }) {
  return api('/auth/change-password/', { method: 'POST', body: JSON.stringify(data) });
}