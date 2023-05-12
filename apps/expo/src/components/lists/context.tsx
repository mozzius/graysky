import { createContext, useContext, useMemo, useRef } from "react";

import { FollowersList, type FollowersListRef } from "./followers-list";
import { FollowsList, type FollowsListRef } from "./follows-list";
import { LikesList, type LikesListRef } from "./likes-list";

const ListContext = createContext<{
  openFollowers: (actor: string) => void;
  openFollows: (actor: string) => void;
  openLikes: (post: string) => void;
} | null>(null);

interface Props {
  children: React.ReactNode;
}

export const ListProvider = ({ children }: Props) => {
  const followersRef = useRef<FollowersListRef>(null);
  const followsRef = useRef<FollowsListRef>(null);
  const likesRef = useRef<LikesListRef>(null);

  const value = useMemo(
    () => ({
      openFollowers: (actor: string) => followersRef.current?.open(actor),
      openFollows: (actor: string) => followsRef.current?.open(actor),
      openLikes: (post: string) => likesRef.current?.open(post),
    }),
    [],
  );

  return (
    <ListContext.Provider value={value}>
      {children}
      <FollowersList ref={followersRef} />
      <FollowsList ref={followsRef} />
      <LikesList ref={likesRef} />
    </ListContext.Provider>
  );
};

export const useLists = () => {
  const context = useContext(ListContext);
  if (!context) throw new Error("Cannot use useLists outside of ListProvider");
  return context;
};
