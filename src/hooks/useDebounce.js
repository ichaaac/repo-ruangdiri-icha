// src/hooks/useDebounce.js

import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value without using useEffect
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} - The debounced value
 */
export const useDebounce = (value, delay = 500) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Cleanup the timeout if value or delay changes
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

export default useDebounce;
