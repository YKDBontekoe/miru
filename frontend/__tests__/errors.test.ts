import { getApiErrorMessage } from '../src/core/api/errors';

describe('getApiErrorMessage', () => {
  it('returns detail string', () => {
    expect(getApiErrorMessage({ response: { data: { detail: 'error 1' } } })).toBe('error 1');
  });

  it('returns detail object message', () => {
    expect(getApiErrorMessage({ response: { data: { detail: { message: 'error 2' } } } })).toBe('error 2');
  });

  it('returns message string', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'error 3' } } })).toBe('error 3');
  });

  it('returns err message', () => {
    expect(getApiErrorMessage({ message: 'error 4' })).toBe('error 4');
  });

  it('returns fallback', () => {
    expect(getApiErrorMessage({})).toBe('Something went wrong. Please try again.');
  });
});
