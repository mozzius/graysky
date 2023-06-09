import { createContext, useContext } from "react";

const LogOutContext = createContext<(() => Promise<void>) | null>(null);

export const LogOutProvider = LogOutContext.Provider;

export const useLogOut = () => {
  const logOut = useContext(LogOutContext);
  if (!logOut) throw new Error("LogOutContext not found");
  return logOut;
};
