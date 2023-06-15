import { useEffect, useMemo, useState } from "react";
import { TextInput } from "react-native";
import { RichText as RichTextHelper } from "@atproto/api";

import { useSelf } from ".";
import { SettingsListGroups } from "../_layout";
import { QueryWithoutData } from "../../../components/query-without-data";
import { RichText } from "../../../components/rich-text";

export default function EditBio() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const self = useSelf();

  useEffect(() => {
    if (self.data) {
      setDisplayName((d) => (d === null ? self.data.displayName ?? "" : d));
      setDescription((d) => (d === null ? self.data.description ?? "" : d));
    }
  }, [self.data]);

  const rt = new RichTextHelper({ text: description ?? "" });
  rt.detectFacetsWithoutResolution();

  const groups = useMemo(
    () => [
      {
        title: "Display name",
        children: (
          <TextInput
            value={displayName ?? ""}
            placeholder="Required"
            onChange={(evt) => setDisplayName(evt.nativeEvent.text)}
            className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
          />
        ),
      },
      {
        title: "Description",
        children: (
          <TextInput
            onChange={(evt) => setDescription(evt.nativeEvent.text)}
            placeholder="Optional"
            multiline
            className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
          >
            <RichText
              size="base"
              text={rt.text}
              facets={rt.facets}
              truncate={false}
              disableLinks
            />
          </TextInput>
        ),
      },
    ],
    [displayName, description, rt.text, rt.facets],
  );

  if (self.data) {
    return <SettingsListGroups groups={groups} />;
  }

  return <QueryWithoutData query={self} />;
}
