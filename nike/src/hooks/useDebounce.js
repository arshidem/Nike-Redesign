// src/hooks/useDebounce.js
import { useRef, useEffect } from 'react';
import { debounce } from '../utils/debounce'; // Adjust path as needed

export const useDebounce = (callback, delay) => {
  const debouncedFn = useRef(debounce(callback, delay));

  useEffect(() => {
    debouncedFn.current = debounce(callback, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      debouncedFn.current.cancel();
    };
  }, []);

  return debouncedFn.current;
};