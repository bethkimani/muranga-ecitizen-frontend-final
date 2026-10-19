export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

export function isNotFound(err: unknown) {
  return (err as { status?: number } | null)?.status === 404;
}