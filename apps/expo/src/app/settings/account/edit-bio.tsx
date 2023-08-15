import { useEffect, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSelf } from ".";
import { QueryWithoutData } from "../../../components/query-without-data";
import { RichText } from "../../../components/rich-text";
import { Text } from "../../../components/text";
import { TextButton } from "../../../components/text-button";
import { useAgent } from "../../../lib/agent";

export default function EditBio() {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const agent = useAgent();
  const queryClient = useQueryClient();
  const router = useRouter();

  const self = useSelf();

  useEffect(() => {
    if (self.data) {
      setDisplayName((d) => (d === null ? self.data.displayName ?? "" : d));
      setDescription((d) => (d === null ? self.data.description ?? "" : d));
    }
  }, [self.data]);

  const rt = new RichTextHelper({ text: description ?? "" });
  rt.detectFacetsWithoutResolution();

  const save = useMutation({
    mutationKey: ["save-profile"],
    mutationFn: async () => {
      await agent.upsertProfile((old) => {
        return {
          ...old,
          displayName: displayName ?? "",
          description: description ?? "",
        };
      });
    },
    onSettled: () => {
      router.push("../");
      void queryClient.invalidateQueries(["self"]);
      void queryClient.invalidateQueries(["profile"]);
    },
  });

  // todo: save/discard buttons should be in the header and only show once editing has started

  if (self.data) {
    return (
      <KeyboardAwareScrollView className="flex-1 px-4">
        <View className="my-4 flex-1">
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
              style={{ color: theme.colors.text }}
              placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
            />
          </View>
        </View>
        <View className="mb-4 flex-1">
          <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
            Description
          </Text>
          <View
            style={{ backgroundColor: theme.colors.card }}
            className="flex-1 overflow-hidden rounded-lg"
          >
            <TextInput
              onChange={(evt) => setDescription(evt.nativeEvent.text)}
              placeholder="Optional"
              multiline
              className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
              placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
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
        <View className="flex-row items-center justify-end pt-2">
          {!save.isLoading ? (
            <TextButton
              // disabled={!identifier || !password}
              onPress={() => save.mutate()}
              title="Save"
              className="font-medium"
            />
          ) : (
            <ActivityIndicator className="px-2" />
          )}
        </View>
      </KeyboardAwareScrollView>
    );
  }

  return <QueryWithoutData query={self} />;
}
