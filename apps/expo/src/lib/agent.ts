import { createContext, useContext } from "react";
import { type BskyAgent } from "@atproto/api";

const agentContext = createContext<BskyAgent | null>(null);

export default agentContext;

export const useAgent = () => {
  const agent = useContext(agentContext);
  if (!agent) throw new Error("No agent found in context");
  return agent;
};

export const useOptionalAgent = () => {
  const agent = useContext(agentContext);
  return agent;
};

export const AgentProvider = agentContext.Provider;
