import { useState, useEffect } from "react";

/**
 * Debounce a value change for a given delay (default 1000ms)
 * Useful for text input -> API fetch to avoid spam.
 */
export function useDebounce<T>(value: T, delay = 1000): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
