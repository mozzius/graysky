import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { type HandleString } from "@atproto/lex";
import { com } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Form } from "~/components/form";
import {
  HandleAvailabilityResult,
  useHandleAvailability,
} from "~/components/handle-availability";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent, useAuth, useSession } from "~/lib/agent";

export default function ChangeHandle() {
  const agent = useAgent();
  const session = useSession();
  const { refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const { _ } = useLingui();
  const router = useRouter();

  const derivedHandle = `${handle.trim()}.bsky.social`;

  const resolveHandle = useHandleAvailability(derivedHandle);

  const changeHandle = useMutation({
    mutationKey: ["change-handle"],
    mutationFn: async () => {
      await agent.call(com.atproto.identity.updateHandle, {
        handle: derivedHandle as HandleString,
      });
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
      // pick up the new handle
      refreshSession().catch((err: unknown) =>
        console.warn("failed to refresh session", err),
      );
      void queryClient.invalidateQueries({ queryKey: ["self"] });
      void queryClient.invalidateQueries({
        queryKey: ["resolve-handle", handle],
      });
      router.push("../");
    },
  });

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          {
            title: _(msg`Domain`),
            rows: [
              {
                title: _(msg`bsky.social domain`),
                selected: true,
              },
              {
                title: _(msg`Custom domain`),
                onPress: () =>
                  Alert.alert(
                    _(msg`Not yet implemented`),
                    _(msg`Please use the official app in the meantime. Sorry!`),
                  ),
              },
            ],
          },
          {
            title: _(msg`Choose a handle`),
            rows: [
              {
                type: "textField",
                key: "handle",
                value: handle,
                textContentType: "username",
                autoCapitalize: "none",
                disabled: changeHandle.isPending,
                maxLength: 20,
                onChangeText: (text) => {
                  setHandle(text.toLocaleLowerCase());
                  changeHandle.reset();
                },
                autoFocus: true,
              },
            ],
            footer: !!handle && (
              <View className="items-start gap-y-2">
                <Text className="text-sm text-neutral-500">
                  <Trans>
                    Your handle will be:{" "}
                    <Text className="font-bold">@{derivedHandle}</Text>
                  </Trans>
                </Text>
                {handle.length >= 3 && (
                  <HandleAvailabilityResult
                    query={resolveHandle}
                    handle={derivedHandle}
                    success={
                      changeHandle.isSuccess ||
                      session?.handle === derivedHandle
                    }
                  />
                )}
              </View>
            ),
          },
          {
            rows: [
              {
                type: "button",
                title: _(msg`Save`),
                disabled: resolveHandle.data !== "available",
                loading: changeHandle.isPending,
                onPress: () => changeHandle.mutate(),
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
