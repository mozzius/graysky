import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RichText as RichTextHelper } from "@atproto/api";
import { useTheme } from "@react-navigation/native";

import { useSelf } from ".";
import { QueryWithoutData } from "../../../components/query-without-data";
import { RichText } from "../../../components/rich-text";

export default function EditBio() {
  const theme = useTheme();
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

  if (self.data) {
    return (
      <ScrollView className="flex-1 px-4">
        <View className="my-4">
          <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
            Display name
          </Text>
          <View
            style={{ backgroundColor: theme.colors.card }}
            className="flex-1 overflow-hidden rounded-lg"
          >
            <TextInput
              value={displayName ?? ""}
              placeholder="Required"
              onChange={(evt) => setDisplayName(evt.nativeEvent.text)}
              className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
            />
          </View>
        </View>
        <View className="mb-4">
          <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
            Description
          </Text>
          <View
            style={{ backgroundColor: theme.colors.card }}
            className="overflow-hidden rounded-lg"
          >
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
          </View>
        </View>
      </ScrollView>
    );
  }

  return <QueryWithoutData query={self} />;
}
