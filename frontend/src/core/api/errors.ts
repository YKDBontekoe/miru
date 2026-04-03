type ApiErrorDetail = {
  error?: string;
  message?: string;
};

type ApiErrorResponse = {
  detail?: string | ApiErrorDetail;
  message?: string;
  error?: string;
};

type ApiLikeError = {
  message?: string;
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const err = error as ApiLikeError | null;
  const data = err?.response?.data;

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data?.detail === 'object' && data.detail?.message) {
    return data.detail.message;
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }
  return fallback;
}
