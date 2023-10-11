import {
  TouchableHighlight,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Link, Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CompassIcon } from "lucide-react-native";

import { Text } from "~/components/text";
import { cx } from "~/lib/utils/cx";

export const NoFeeds = ({ onPress }: { onPress?: () => void }) => {
  const theme = useTheme();
  return (
    <View className="flex-1 items-center justify-center">
      <Stack.Screen options={{ headerRight: () => null }} />
      <View className="w-3/4 flex-col items-start">
        <Text className="mb-4 text-4xl font-medium">Welcome to Bluesky!</Text>
        <Text className="text-lg">
          To get started, add some feeds to your home screen.
        </Text>
        <Link asChild href="/feeds/discover" onPress={onPress}>
          <TouchableOpacity
            className="mt-8 flex-row items-center rounded-full py-2 pl-4 pr-8"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <CompassIcon size={20} className="text-white" />
            <Text className="ml-4 text-xl text-white">Discover feeds</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export const SectionHeader = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <View
      className="w-full px-4 py-1"
      style={{
        backgroundColor: theme.dark
          ? theme.colors.card
          : theme.colors.background,
      }}
    >
      <Text
        className={cx(
          "font-medium",
          theme.dark ? "text-neutral-400" : "text-neutral-600",
        )}
      >
        {title.toLocaleUpperCase()}
      </Text>
    </View>
  );
};

interface LargeRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
  onPress?: () => void;
  replace?: boolean;
}

export const LargeRow = ({
  icon,
  title,
  subtitle,
  className,
  style,
  right,
  onPress,
  replace,
}: LargeRowProps) => {
  const theme = useTheme();
  return (
    <Link href="/feeds/following" asChild onPress={onPress} replace={replace}>
      <TouchableHighlight>
        <View
          className={cx(
            "flex-row items-center p-4",
            theme.dark ? "bg-black" : "bg-white",
            className,
          )}
          style={style}
        >
          <View className="h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500">
            {icon}
          </View>
          <View className="flex-1 px-3">
            <Text className="text-lg leading-5">{title}</Text>
            <Text className="text-sm text-neutral-500">{subtitle}</Text>
          </View>
          {right}
        </View>
      </TouchableHighlight>
    </Link>
  );
};
