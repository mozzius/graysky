import { createContext, useContext, useMemo, useRef } from "react";

import { FollowersList, type FollowersListRef } from "./followers-list";
import { FollowsList, type FollowsListRef } from "./follows-list";
import { LikesList, type LikesListRef } from "./likes-list";
import { RepostsList, type RepostsListRef } from "./reposts-list";

const ListContext = createContext<{
  openFollowers: (actor: string, limit?: number) => void;
  openFollows: (actor: string, limit?: number) => void;
  openLikes: (post: string, limit?: number) => void;
  openReposts: (post: string, limit?: number) => void;
} | null>(null);

interface Props {
  children: React.ReactNode;
}

export const ListProvider = ({ children }: Props) => {
  const followersRef = useRef<FollowersListRef>(null);
  const followsRef = useRef<FollowsListRef>(null);
  const likesRef = useRef<LikesListRef>(null);
  const repostsRef = useRef<RepostsListRef>(null);

  const value = useMemo(
    () => ({
      openFollowers: (actor: string, limit?: number) =>
        followersRef.current?.open(actor, limit),
      openFollows: (actor: string, limit?: number) =>
        followsRef.current?.open(actor, limit),
      openLikes: (post: string, limit?: number) =>
        likesRef.current?.open(post, limit),
      openReposts: (post: string, limit?: number) =>
        repostsRef.current?.open(post, limit),
    }),
    [],
  );

  return (
    <ListContext.Provider value={value}>
      {children}
      <FollowersList ref={followersRef} />
      <FollowsList ref={followsRef} />
      <LikesList ref={likesRef} />
      <RepostsList ref={repostsRef} />
    </ListContext.Provider>
  );
};

export const useLists = () => {
  const context = useContext(ListContext);
  if (!context) throw new Error("Cannot use useLists outside of ListProvider");
  return context;
};
