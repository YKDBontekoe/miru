import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a fast-changing value.
 *
 * @param value - The value to debounce.
 * @param delayMs - The debounce delay in milliseconds.
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
