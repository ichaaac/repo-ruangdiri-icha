// src/hooks/useDebounce.js - Optimized to reduce delays
import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 300) => { // Reduced delay for faster search
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;