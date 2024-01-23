import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useComposerState } from "~/lib/composer/state";
import { produce } from "~/lib/utils/produce";

export default function ThreadgateScreen() {
  const [{ threadgate }, setComposerState] = useComposerState();
  const agent = useAgent();

  const lists = useQuery({
    queryKey: [agent.session?.did, "lists"],
    queryFn: async () => {
      if (!agent.session) return null;
      const lists = await agent.app.bsky.graph.getLists({
        actor: agent.session.did,
      });
      if (!lists.success) throw new Error("Couldn't fetch lists");
      return lists.data;
    },
  });

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "Who can reply?",
            options: [
              {
                title: "Everyone can reply",
                icon: threadgate.length === 0 ? CheckIcon : "SPACE",
                onPress: () =>
                  setComposerState(
                    produce((draft) => {
                      draft.threadgate = [];
                    }),
                  ),
              },
              {
                title: "No one can reply",
                icon: threadgate.find((gate) => gate.type === "nobody")
                  ? CheckIcon
                  : "SPACE",
                onPress: () =>
                  setComposerState(
                    produce((draft) => {
                      draft.threadgate = [{ type: "nobody" }];
                    }),
                  ),
              },
              {
                title: "Specific people can reply",
                icon:
                  threadgate.length > 0 &&
                  !threadgate.find((gate) => gate.type === "nobody")
                    ? CheckIcon
                    : "SPACE",
                onPress: () => {
                  if (
                    threadgate.length === 0 ||
                    threadgate.find((gate) => gate.type === "nobody")
                  ) {
                    setComposerState(
                      produce((draft) => {
                        draft.threadgate = [{ type: "mention" }];
                      }),
                    );
                  }
                },
              },
            ],
          },
          threadgate.length > 0 &&
            !threadgate.find((gate) => gate.type === "nobody") && {
              title: "Select one or more options",
              options: [
                {
                  title: "People mentioned in the thread",
                  icon: threadgate.find((gate) => gate.type === "mention")
                    ? CheckIcon
                    : "SPACE",
                  onPress: () =>
                    setComposerState(
                      produce((draft) => {
                        if (
                          draft.threadgate.find(
                            (gate) => gate.type === "mention",
                          )
                        ) {
                          draft.threadgate = draft.threadgate.filter(
                            (gate) => gate.type !== "mention",
                          );
                        } else {
                          draft.threadgate.push({ type: "mention" });
                        }
                      }),
                    ),
                },
                {
                  title: "People you follow",
                  icon: threadgate.find((gate) => gate.type === "following")
                    ? CheckIcon
                    : "SPACE",
                  onPress: () =>
                    setComposerState(
                      produce((draft) => {
                        if (
                          draft.threadgate.find(
                            (gate) => gate.type === "following",
                          )
                        ) {
                          draft.threadgate = draft.threadgate.filter(
                            (gate) => gate.type !== "following",
                          );
                        } else {
                          draft.threadgate.push({ type: "following" });
                        }
                      }),
                    ),
                },
                ...(lists.data?.lists?.map((list) => ({
                  title: `Members of list "${list.name}"`,
                  icon: threadgate.find(
                    (gate) => gate.type === "list" && gate.list === list.uri,
                  )
                    ? CheckIcon
                    : "SPACE",
                  onPress: () =>
                    setComposerState(
                      produce((draft) => {
                        if (
                          draft.threadgate.find(
                            (gate) =>
                              gate.type === "list" && gate.list === list.uri,
                          )
                        ) {
                          draft.threadgate = draft.threadgate.filter(
                            (gate) =>
                              gate.type !== "list" || gate.list !== list.uri,
                          );
                        } else {
                          draft.threadgate.push({
                            type: "list",
                            list: list.uri,
                          });
                        }
                      }),
                    ),
                })) ?? ([] as { title: string }[])),
              ],
            },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
