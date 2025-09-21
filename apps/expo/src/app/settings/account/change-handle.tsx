import { useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react-native";

import { ListGroup } from "~/components/grouped-list";
import {
  HandleAvailabilityResult,
  useHandleAvailability,
} from "~/components/handle-availability";
import { ItemSeparator } from "~/components/item-separator";
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
  const { _ } = useLingui();
  const router = useRouter();

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
            _(msg`Handle already taken`),
            _(msg`This handle is already taken. Please choose another.`),
          );
        } else {
          Alert.alert(_(msg`Error`), err.message);
        }
      } else {
        Alert.alert(
          _(msg`Could not change handle`),
          _(msg`An unknown error occurred.`),
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["self"] });
      void queryClient.invalidateQueries({
        queryKey: ["resolve-handle", handle],
      });
      router.push("../");
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
            <Trans>Domain</Trans>
          </Text>
          <ListGroup
            options={[
              {
                title: _(msg`bsky.social domain`),
                icon: CheckIcon,
              },
              {
                title: _(msg`Custom domain`),
                icon: "SPACE",
                onPress: () =>
                  Alert.alert(
                    _(msg`Not yet implemented`),
                    _(msg`Please use the official app in the meantime. Sorry!`),
                  ),
              },
            ]}
          />
          <Text className="mx-4 mb-1.5 mt-8 text-xs uppercase text-neutral-500">
            <Trans>Choose a handle</Trans>
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
                <Trans>
                  Your handle will be:{" "}
                  <Text className="font-bold">@{derivedHandle}</Text>
                </Trans>
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
              title={_(msg`Save`)}
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
