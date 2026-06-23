import { useEffect, useState } from 'react';

/**
 * Hook that delays the updating of a value until a specified delay has passed since the last change.
 * Useful for limiting the rate of actions like API calls on search input changes.
 *
 * @template T
 * @param {T} value - The value to debounce.
 * @param {number} delayMs - The delay in milliseconds to wait before updating the returned value.
 * @returns {T} The debounced value.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
