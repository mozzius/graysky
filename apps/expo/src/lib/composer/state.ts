import { createContext, useContext } from "react";
import { type AppBskyEmbedExternal } from "@atproto/api";

export type ThreadgateSetting =
  | { type: "nobody" }
  | { type: "following" }
  | { type: "mention" }
  | { type: "list"; list: string };

export interface ComposerState {
  gif?: {
    view: AppBskyEmbedExternal.View;
    main: AppBskyEmbedExternal.Main;
  };
  languages: string[];
  reply?: string;
  quote?: string;
  initialText?: string;
  labels: string[];
  threadgate: ThreadgateSetting[];
}

const ComposerStateContext = createContext<
  [ComposerState, React.Dispatch<React.SetStateAction<ComposerState>>] | null
>(null);

export const ComposerStateProvider = ComposerStateContext.Provider;

export const useComposerState = () => {
  const context = useContext(ComposerStateContext);
  if (!context) {
    throw new Error(
      "useComposerState must be used within a ComposerStateProvider",
    );
  }
  return context;
};
