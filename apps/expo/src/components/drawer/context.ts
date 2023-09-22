import { createContext, useContext } from "react";

const DrawerContext = createContext<((open?: boolean) => void) | null>(null);

export const DrawerProvider = DrawerContext.Provider;

export const useDrawer = () => {
  const openDrawer = useContext(DrawerContext);
  if (!openDrawer)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return openDrawer;
};
