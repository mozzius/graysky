import { useCallback } from "react";
import { useSegments } from "expo-router";

export const useAbsolutePath = () => {
  const segments = useSegments();
  const base = segments.slice(0, 2).join("/");
  return useCallback((path: string) => `${base}${path}`, [base]);
};
