import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSegments } from "expo-router";

const AbsolutePathContext = createContext<string>("");

export const AbsolutePathProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [base, setBase] = useState("");
  const segments = useSegments();

  const path = segments.slice(0, 2).join("/");

  useEffect(() => {
    if (path.startsWith("(tabs)")) {
      setBase(path);
    }
  }, [path]);

  return (
    <AbsolutePathContext.Provider value={base}>
      {children}
    </AbsolutePathContext.Provider>
  );
};

export const useAbsolutePath = () => {
  const base = useContext(AbsolutePathContext);
  useEffect(() => {
    console.log("base changed", base);
  }, [base]);
  return useCallback((path: string) => `${base}${path}`, [base]);
};
