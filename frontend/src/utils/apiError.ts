export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: string } } };
  return err.response?.data?.error || fallback;
}
