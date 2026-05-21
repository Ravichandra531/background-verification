type ApiErrorBody = {
  error?: string;
  field?: string;
};

export function getApiError(error: unknown, fallback: string): { message: string; field?: string } {
  const err = error as { response?: { data?: ApiErrorBody } };
  return {
    message: err.response?.data?.error || fallback,
    field: err.response?.data?.field,
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return getApiError(error, fallback).message;
}
