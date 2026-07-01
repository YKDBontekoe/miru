import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a rapidly changing value (e.g. search inputs).
 *
 * It delays the state update of the given `value` until after `delayMs` milliseconds
 * have elapsed since the last time the `value` was changed.
 *
 * @param value - The value to debounce.
 * @param delayMs - The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
