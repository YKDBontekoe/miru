import { useEffect, useState } from 'react';

/**
 * Custom hook that delays updating a value until after a specified delay has passed since the last change.
 * Useful for rate-limiting operations like API calls during user input.
 *
 * @template T - The type of the value being debounced.
 * @param {T} value - The input value to debounce.
 * @param {number} delayMs - The debounce delay in milliseconds.
 * @returns {T} The debounced value, which updates only after `delayMs` has elapsed with no changes to `value`.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
