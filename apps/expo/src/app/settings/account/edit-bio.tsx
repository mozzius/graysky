import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryWithoutData } from "~/components/query-without-data";
import { RichText } from "~/components/rich-text";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useSelf } from ".";

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
      void queryClient.invalidateQueries({ queryKey: ["self"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // todo: save/discard buttons should be in the header and only show once editing has started

  if (self.data) {
    return (
      <TransparentHeaderUntilScrolled>
        <ScrollView
          className="flex-1 px-4"
          contentInsetAdjustmentBehavior="automatic"
        >
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
            {!save.isPending ? (
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
        </ScrollView>
      </TransparentHeaderUntilScrolled>
    );
  }

  return <QueryWithoutData query={self} />;
}
