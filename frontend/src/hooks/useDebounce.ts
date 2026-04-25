import { useEffect, useState } from 'react';

/**
 * Hook to debounce a value, delaying its update until a specified time has passed
 * without any further changes. Useful for optimizing performance by limiting the
 * rate at which a state updates (e.g., search input fields).
 *
 * @param value - The value to be debounced.
 * @param delayMs - The debounce delay in milliseconds.
 * @returns The debounced value.
 *
 * Side effects:
 * - Sets a timeout on value change to update the debounced state.
 * - Clears the previous timeout if the value changes before the delay elapses.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
