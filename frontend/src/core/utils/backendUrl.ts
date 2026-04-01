const API_V1_SUFFIX = '/api/v1';

export function normalizeApiBaseUrl(rawBaseUrl: string): string {
  const trimmed = rawBaseUrl.replace(/\/+$/, '');

  if (trimmed.endsWith(API_V1_SUFFIX)) {
    return trimmed;
  }

  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}${API_V1_SUFFIX}`;
}

export function toHealthBaseUrl(rawBaseUrl: string): string {
  return normalizeApiBaseUrl(rawBaseUrl).replace(/\/api\/v1$/, '');
}
