import { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useNavigation, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../lib/agent";
import { useRefreshOnFocus } from "../../lib/utils/query";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const navigation = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    // we want to do navigation.getState().routes.length > 1
    // however this is the layout so we need to go find the child route
    setCanGoBack(
      (navigation.getState().routes.find((x) => x.name === "codes")?.state
        ?.routes.length ?? 1) > 1,
    );
  }, [pathname, navigation]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerRight: canGoBack
            ? undefined
            : () => (
                <Animated.View entering={FadeIn}>
                  <TouchableOpacity onPress={() => router.push("../")}>
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="text-lg font-medium"
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Invite Codes",
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="invitees"
          options={{
            title: "Invitees",
          }}
        />
      </Stack>
    </>
  );
}

export const useInviteCodes = () => {
  const agent = useAuthedAgent();

  const query = useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      const codes = await agent.com.atproto.server.getAccountInviteCodes({
        includeUsed: true,
      });
      if (!codes.success) throw new Error("Could not get invite codes");
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
