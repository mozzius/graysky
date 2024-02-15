import { useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react-native";

import { ListGroup } from "~/components/grouped-list";
import {
  HandleAvailabilityResult,
  useHandleAvailability,
} from "~/components/handle-availability";
import { ItemSeparator } from "~/components/item-separator";
import KeyboardAwareScrollView from "~/components/scrollview/keyboard-aware-scrollview";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";

export default function ChangeHandle() {
  const theme = useTheme();
  const agent = useAgent();
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");

  const derivedHandle = `${handle.trim()}.bsky.social`;

  const resolveHandle = useHandleAvailability(derivedHandle);

  const changeHandle = useMutation({
    mutationKey: ["change-handle"],
    mutationFn: async () => {
      await agent.updateHandle({ handle: derivedHandle });
    },
    onError: (err) => {
      if (err instanceof Error) {
        if (err.message === "Handle already taken") {
          Alert.alert(
            "ハンドルネームは使われています",
            "このハンドルネームはすでに使われています。他を選んでください。",
          );
        } else {
          Alert.alert("Error", err.message);
        }
      } else {
        Alert.alert("Could not change handle", "不明なエラーが発生しました。");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["self"] });
      void queryClient.invalidateQueries({
        queryKey: ["resolve-handle", handle],
      });
    },
  });

  return (
    <TransparentHeaderUntilScrolled>
      <KeyboardAwareScrollView
        className="flex-1 px-4"
        contentInsetAdjustmentBehavior="automatic"
        style={Platform.select({
          android: { backgroundColor: theme.colors.card },
        })}
      >
        <View className="my-4 flex-1">
          <Text className="mx-4 mb-1.5 mt-2 text-xs uppercase text-neutral-500">
            Domain
          </Text>
          <ListGroup
            options={[
              {
                title: "bsky.social のドメイン",
                icon: CheckIcon,
              },
              {
                title: "カスタムドメイン",
                icon: "SPACE",
                onPress: () =>
                  Alert.alert(
                    "未実装",
                    "ごめんなさい!その間は公式アプリを使ってください。",
                  ),
              },
            ]}
          />
          <Text className="mx-4 mb-1.5 mt-8 text-xs uppercase text-neutral-500">
            Choose a handle
          </Text>
          <View
            style={{ backgroundColor: theme.colors.card }}
            className="flex-1 overflow-hidden rounded-lg"
          >
            <TextInput
              value={handle}
              autoComplete="username"
              autoCapitalize="none"
              readOnly={changeHandle.isPending}
              maxLength={20}
              onChange={(evt) => {
                setHandle(evt.nativeEvent.text.toLocaleLowerCase());
                changeHandle.reset();
              }}
              className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
              autoFocus
            />
            {Platform.OS === "android" && <ItemSeparator />}
          </View>
          {handle && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              layout={LinearTransition}
            >
              <Text className="mx-4 mt-3 text-sm text-neutral-500">
                Your handle will be:{" "}
                <Text className="font-bold">@{derivedHandle}</Text>
              </Text>
            </Animated.View>
          )}
          {handle.length >= 3 && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              layout={LinearTransition}
              className="mx-4 mt-2 items-start"
            >
              <HandleAvailabilityResult
                query={resolveHandle}
                handle={derivedHandle}
                success={
                  changeHandle.isSuccess ||
                  agent.session?.handle === derivedHandle
                }
              />
            </Animated.View>
          )}
        </View>
        <Animated.View
          className="flex-row items-center justify-end pt-2"
          layout={LinearTransition}
        >
          {!changeHandle.isPending ? (
            <TextButton
              disabled={resolveHandle.data !== "available"}
              onPress={() => changeHandle.mutate()}
              title="保存"
              className="font-medium"
            />
          ) : (
            <ActivityIndicator className="px-2" />
          )}
        </Animated.View>
      </KeyboardAwareScrollView>
    </TransparentHeaderUntilScrolled>
  );
}
