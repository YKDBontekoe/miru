import { normalizeApiBaseUrl, toHealthBaseUrl } from '../src/core/utils/backendUrl';

describe('backend URL normalization', () => {
  it('appends /api/v1 when base URL has no path', () => {
    expect(normalizeApiBaseUrl('https://example.com')).toBe('https://example.com/api/v1');
  });

  it('upgrades /api to /api/v1', () => {
    expect(normalizeApiBaseUrl('https://example.com/api')).toBe('https://example.com/api/v1');
  });

  it('preserves an existing /api/v1 path', () => {
    expect(normalizeApiBaseUrl('https://example.com/api/v1/')).toBe('https://example.com/api/v1');
  });

  it('derives a health endpoint base URL', () => {
    expect(toHealthBaseUrl('https://example.com/api/v1')).toBe('https://example.com');
    expect(toHealthBaseUrl('https://example.com')).toBe('https://example.com');
  });
});
