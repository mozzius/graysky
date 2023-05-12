import { createContext, useContext, useMemo, useRef } from "react";

import { FollowersList, type FollowersListRef } from "./followers-list";
import { FollowsList, type FollowsListRef } from "./follows-list";

const ListContext = createContext<{
  openFollowers: (actor: string) => void;
  openFollows: (actor: string) => void;
} | null>(null);

interface Props {
  children: React.ReactNode;
}

export const ListProvider = ({ children }: Props) => {
  const followersRef = useRef<FollowersListRef>(null);
  const followsRef = useRef<FollowsListRef>(null);

  const value = useMemo(
    () => ({
      openFollowers: (actor: string) => followersRef.current?.open(actor),
      openFollows: (actor: string) => followsRef.current?.open(actor),
    }),
    [],
  );

  return (
    <ListContext.Provider value={value}>
      {children}
      <FollowersList ref={followersRef} />
      <FollowsList ref={followsRef} />
    </ListContext.Provider>
  );
};

export const useLists = () => {
  const context = useContext(ListContext);
  if (!context) throw new Error("Cannot use useLists outside of ListProvider");
  return context;
};
