import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Link, Stack } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { PlusIcon } from "lucide-react-native";

import { Text } from "~/components/themed/text";
import { useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { isIOS26 } from "~/lib/utils/version";
import { FeedsPage } from ".";

export default function Page() {
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const haptics = useHaptics();
  const { _ } = useLingui();

  return (
    <>
      <Stack.Screen
        options={{
          title: _(msg`Feeds`),
          headerTransparent: isIOS26,
          headerRight: () => (
            <View className="flex-row items-center px-3">
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setEditing((e) => !e);
                }}
                accessibilityLabel={
                  editing ? _(msg`Stop editing`) : _(msg`Edit feeds`)
                }
              >
                <Text
                  primary
                  className={cx("text-lg", editing && "font-medium")}
                >
                  {editing ? <Trans>Done</Trans> : <Trans>Edit</Trans>}
                </Text>
              </TouchableOpacity>
              {!editing && (
                <Link href="/discover" asChild>
                  <TouchableOpacity
                    className="ml-4"
                    accessibilityLabel="Discover feeds"
                    accessibilityRole="link"
                  >
                    <PlusIcon size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </Link>
              )}
            </View>
          ),
        }}
      />
      <FeedsPage editing={editing} />
    </>
  );
}
