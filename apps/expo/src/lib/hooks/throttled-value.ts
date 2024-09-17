import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useRef,
  useState,
} from "react";

export function useThrottledValue<T>(value: T, time: number) {
  const pendingValueRef = useRef(value);
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    pendingValueRef.current = value;
  }, [value]);

  const handleTick = useNonReactiveCallback(() => {
    if (pendingValueRef.current !== throttledValue) {
      setThrottledValue(pendingValueRef.current);
    }
  });

  useEffect(() => {
    const id = setInterval(handleTick, time);
    return () => {
      clearInterval(id);
    };
  }, [handleTick, time]);

  return throttledValue;
}

function useNonReactiveCallback<T extends Function>(fn: T): T {
  const ref = useRef(fn);
  useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback(
    (...args: any) => {
      const latestFn = ref.current;
      return latestFn(...args);
    },
    [ref],
  ) as unknown as T;
}
