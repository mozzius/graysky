import { View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@react-navigation/native";
import { CheckIcon, CopyIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { useInviteCodes } from "./_layout";

export default function InviteCodesScreen() {
  const [appPrefs, setAppPrefs] = useAppPreferences();
  const theme = useTheme();
  const haptics = useHaptics();

  const codes = useInviteCodes();

  if (codes.data) {
    return (
      <GroupedList
        groups={[
          {
            children:
              codes.data.unused.length === 0 ? (
                <View className="flex-1 px-8 py-3">
                  <Text className="text-center text-base">
                    You don{"'"}t have any codes at the moment {":("}
                  </Text>
                </View>
              ) : (
                <></>
              ),
            options: codes.data.unused.map((code) => ({
              title: code.code,
              onPress: () => {
                haptics.impact();
                void Clipboard.setStringAsync(code.code);
                setAppPrefs({
                  copiedCodes: [...appPrefs.copiedCodes, code.code],
                });
              },
              action: appPrefs.copiedCodes.includes(code.code) ? (
                <CheckIcon size={18} color={theme.colors.text} />
              ) : (
                <CopyIcon size={18} color={theme.colors.text} />
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
    );
  }

  return <QueryWithoutData query={codes} />;
}
