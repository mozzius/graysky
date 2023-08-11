import { createContext, useContext, useMemo } from "react";
import { type BskyAgent } from "@atproto/api";

const agentContext = createContext<{ agent: BskyAgent | null; update: number }>(
  {
    agent: null,
    update: 0,
  },
);

export default agentContext;

export const useAgent = () => {
  const { agent } = useContext(agentContext);
  if (!agent) throw new Error("No agent found in context");
  return agent;
};

export const useOptionalAgent = () => {
  const { agent } = useContext(agentContext);
  return agent;
};

export const AgentProvider = ({
  agent,
  children,
  update,
}: React.PropsWithChildren<{ agent: BskyAgent | null; update: number }>) => {
  const combined = useMemo(() => ({ agent, update }), [agent, update]);
  return (
    <agentContext.Provider value={combined}>{children}</agentContext.Provider>
  );
};
