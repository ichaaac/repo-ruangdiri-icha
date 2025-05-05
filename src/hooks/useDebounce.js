// src/hooks/useDebounce.js

import { useState, useRef } from 'react';

/**
 * Custom hook to debounce a value without using useEffect
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} - The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);
  
  // Update the ref and set a new timeout whenever value changes
  if (value !== debouncedValue) {
    // Clear any existing timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timeout
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);
  }
  
  return debouncedValue;
};

export default useDebounce;