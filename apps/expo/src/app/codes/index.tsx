import { Text, View } from "react-native";
import { set } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@react-navigation/native";
import { Check, Copy } from "lucide-react-native";

import { GroupedList } from "../../components/grouped-list";
import { QueryWithoutData } from "../../components/query-without-data";
import { useAppPreferences } from "../../lib/hooks/preferences";
import { useInviteCodes } from "./_layout";

export default function InviteCodesScreen() {
  const { appPrefs, setAppPrefs } = useAppPreferences();
  const theme = useTheme();
  const headerHeight = useHeaderHeight();

  const codes = useInviteCodes();

  if (!appPrefs.data) {
    return <QueryWithoutData query={appPrefs} />;
  }

  if (codes.data) {
    return (
      <View style={{ paddingTop: headerHeight + 16 }} className="flex-1">
        <GroupedList
          groups={[
            {
              children:
                codes.data.unused.length === 0 ? (
                  <View className="flex-1 px-8 py-3">
                    <Text
                      style={{ color: theme.colors.text }}
                      className="text-center text-base"
                    >
                      You don't have any codes at the moment {":("}
                    </Text>
                  </View>
                ) : (
                  <></>
                ),
              options: codes.data.unused.map((code) => ({
                title: code.code,
                onPress: () => {
                  void Haptics.impactAsync();
                  void Clipboard.setStringAsync(code.code);
                  setAppPrefs.mutate({
                    copiedCodes: [...appPrefs.data.copiedCodes, code.code],
                  });
                },
                action: appPrefs.data.copiedCodes.includes(code.code) ? (
                  <Check size={18} color={theme.colors.text} />
                ) : (
                  <Copy size={18} color={theme.colors.text} />
                ),
              })),
            },
            codes.data.used.length > 0
              ? {
                  options: [
                    {
                      title: "See everyone you've invited",
                      href: "/codes/invitees",
                    },
                  ],
                }
              : [],
          ].flat()}
        />
      </View>
    );
  }

  return <QueryWithoutData query={codes} />;
}
