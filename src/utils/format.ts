import { format, formatDistanceStrict, differenceInCalendarDays } from 'date-fns';

// Prototype "today" so sample data reads consistently.
export const NOW = new Date('2026-10-17T10:30:00');

export function formatDate(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy, h:mm a');
}

export function relativeTime(iso: string): string {
  return `${formatDistanceStrict(new Date(iso), NOW)} ago`;
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(new Date(iso), NOW);
}

export function greeting(): string {
  const h = NOW.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initials(name: string): string {
  return name.
  split(' ').
  map((p) => p[0]).
  slice(0, 2).
  join('').
  toUpperCase();
}