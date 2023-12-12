import { createContext, useCallback, useContext } from "react";

const AbsolutePathContext = createContext<string>("");

export const AbsolutePathProvider = ({
  children,
  segment,
}: {
  children: React.ReactNode;
  segment: string;
}) => {
  return (
    <AbsolutePathContext.Provider value={`/(tabs)/${segment}`}>
      {children}
    </AbsolutePathContext.Provider>
  );
};

export const useAbsolutePath = () => {
  const base = useContext(AbsolutePathContext);
  return useCallback((path: string) => `${base}${path}`, [base]);
};
