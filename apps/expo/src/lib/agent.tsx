import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { create } from "zustand";

export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  session: AtpSessionData;
  signedOut?: boolean;
}

interface AgentStore {
  current: string | null;
  agents: Record<string, BskyAgent>;
  sessions: Record<string, AtpSessionData>;
  createAgent: (did: string, service: string) => BskyAgent;
  logIn: (did: string, agent: BskyAgent) => void;
  logOut: () => void;
  resume: (did: string) => Promise<void>;
}

const useAgentStore = create<AgentStore>((set, get) => ({
  current: null,
  agents: {},
  sessions: {},
  logIn(did, agent) {
    set((state) => ({
      agents: { ...state.agents, [did]: agent },
      sessions: { ...state.sessions, [did]: agent.session! },
      current: did,
    }));
  },
  logOut() {
    set(() => ({
      current: null,
    }));
  },
  async resume(did) {
    const agent = get().agents[did];
    if (agent) {
      set(() => ({
        current: did,
      }));
    }
    const session = get().sessions[did];
    if (!session) throw new Error("No session for that DID");
    const newAgent = new BskyAgent({
      service: "https://bsky.social",
    });
    await newAgent.resumeSession(session);
  },
  createAgent(did: string, service: string) {},
}));

export const useAgent = () => {
  const agent = useAgentStore(
    (state) => state.current && state.agents[state.current],
  );
  if (!agent) throw new Error("No agent");
  return agent;
};

export const useOptionalAgent = () => {
  return (
    useAgentStore((state) =>
      state.current ? state.agents[state.current] : null,
    ) ?? null
  );
};
