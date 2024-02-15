import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useCanGoBack } from "~/lib/hooks/can-go-back";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const canGoBack = useCanGoBack("codes");

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          ...Platform.select({
            ios: {
              headerRight: () =>
                canGoBack || (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity onPress={() => router.push("../")}>
                      <Text primary className="text-lg font-medium">
                        Done
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ),
            },
            android: {
              animation: "ios",
            },
          }),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "招待コード",
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="invitees"
          options={{
            title: "招待者",
          }}
        />
      </Stack>
    </>
  );
}

export const useInviteCodes = () => {
  const agent = useAgent();

  const query = useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      const codes = await agent.com.atproto.server.getAccountInviteCodes({
        includeUsed: true,
      });
      if (!codes.success)
        throw new Error(
          "招待コードを取得できませんでした。アプリパスワードを使用してログインをした可能性があります。メインパスワードでログインをしてください。",
        );
      const all = codes.data.codes.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return {
        used: all.filter((x) => x.uses.length >= x.available),
        unused: all.filter((x) => x.uses.length < x.available),
      };
    },
  });

  useRefreshOnFocus(query.refetch);

  return query;
};
