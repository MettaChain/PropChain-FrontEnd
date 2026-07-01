import { useEffect, useRef, useCallback } from 'react';

export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, []);

  const setTimeoutSafe = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.add(id);
    return id;
  }, []);

  const clearTimeoutSafe = useCallback((id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id);
    timeoutsRef.current.delete(id);
    return id;
  }, []);

  return { setTimeoutSafe, clearTimeoutSafe };
}
