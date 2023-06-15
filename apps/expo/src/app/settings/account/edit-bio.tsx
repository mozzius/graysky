import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { RichText as RichTextHelper, type BskyAgent } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { useSelf } from ".";
import { SettingsListGroups } from "../_layout";
import { QueryWithoutData } from "../../../components/query-without-data";
import { RichText } from "../../../components/rich-text";
import { useAuthedAgent } from "../../../lib/agent";

const generateRichText = async (text: string, agent: BskyAgent) => {
  const rt = new RichTextHelper({ text });
  await rt.detectFacets(agent);
  return rt;
};

export default function EditBio() {
  const agent = useAuthedAgent();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const self = useSelf();

  useEffect(() => {
    console.log("USEEFFECT");
    if (self.data) {
      setDisplayName((d) => (d === null ? self.data.displayName ?? "" : d));
      setDescription((d) => (d === null ? self.data.description ?? "" : d));
    }
  }, [self.data]);

  const rt = useQuery({
    queryKey: ["rt", description],
    queryFn: async () => {
      console.log("RT");
      return await generateRichText(description ?? "", agent);
    },
    keepPreviousData: true,
  });

  if (self.data) {
    return (
      <SettingsListGroups
        groups={[
          {
            title: "Display name",
            children: (
              <TextInput
                value={displayName ?? ""}
                onChange={(evt) => {
                  console.log("CHANGE", evt.nativeEvent.text);
                  setDisplayName(evt.nativeEvent.text);
                }}
                className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
              />
            ),
          },
          {
            title: "Description",
            children: (
              <TextInput
                value={description ?? ""}
                onChange={(evt) => {
                  console.log("CHANGE", evt.nativeEvent.text);
                  setDescription(evt.nativeEvent.text);
                }}
                placeholder="Optional"
                multiline
                className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
              >
                <RichText
                  size="xl"
                  text={rt.data?.text ?? description ?? ""}
                  facets={rt.data?.facets}
                  truncate={false}
                  disableLinks
                />
              </TextInput>
            ),
          },
        ]}
      />
    );
  }

  return <QueryWithoutData query={self} />;
}
