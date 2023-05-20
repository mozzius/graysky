import { type AtpSessionData, type BskyAgent } from "@atproto/api";
import { useRouter } from "expo-router";
import { createContext, useContext } from "react";

const agentContext = createContext<BskyAgent | null>(null);

export default agentContext;

export const useAgent = () => {
  const agent = useContext(agentContext);
  if (!agent) throw new Error("No agent found in context");
  return agent;
};

export const useAuthedAgent = () => {
  const router = useRouter();
  const agent = useContext(agentContext);
  if (!agent) throw new Error("No agent found in context");
  if (!agent.hasSession) router.replace("/login");
  return agent as BskyAgent & { session: AtpSessionData };
};

export const AgentProvider = agentContext.Provider;
