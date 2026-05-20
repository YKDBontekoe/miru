import { useEffect, useState } from 'react';

/**
 * A hook that delays updating a value until a specified amount of time has passed
 * without any new updates. Useful for rate-limiting rapid inputs (e.g., search bars).
 *
 * @param value - The value to debounce.
 * @param delayMs - The debounce delay in milliseconds.
 * @returns The debounced value.
 *
 * @sideeffects Manages internal timers to delay value updates.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
