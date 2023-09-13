import {
  Linking,
  Platform,
  Share,
  TouchableHighlight,
  View,
} from "react-native";
import { Image } from "expo-image";
import { type AppBskyEmbedExternal } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { LinkIcon } from "lucide-react-native";

import { cx } from "~/lib/utils/cx";
import { Text } from "../text";

interface Props {
  content: AppBskyEmbedExternal.View;
  transparent: boolean;
  depth: number;
}

export const ExternalEmbed = ({ content, transparent, depth }: Props) => {
  const theme = useTheme();
  return (
    <TouchableHighlight
      accessibilityRole="link"
      className="mt-1.5 flex-1 rounded-lg"
      onPress={() => Linking.openURL(content.external.uri)}
      onLongPress={() =>
        Share.share(
          Platform.select({
            ios: { url: content.external.uri },
            default: { message: content.external.uri },
          }),
        )
      }
    >
      <View
        className={cx(
          "flex-1 overflow-hidden rounded-lg border",
          theme.dark ? "bg-black" : "bg-white",
          transparent && "bg-transparent",
          depth > 0 && "flex-row",
        )}
        style={{ borderColor: theme.colors.border }}
      >
        {content.external.thumb && (
          <Image
            recyclingKey={content.external.thumb}
            source={{ uri: content.external.thumb }}
            alt={content.external.title || content.external.uri}
            contentFit="cover"
            className={cx(
              "object-cover",
              depth === 0 ? "aspect-[2/1] w-full" : "aspect-square h-full",
            )}
          />
        )}
        <View
          className={cx(
            "flex-1 p-2",
            content.external.thumb && (depth === 0 ? "border-t" : "border-l"),
          )}
          style={{ borderColor: theme.colors.border }}
        >
          <View className="flex-1 flex-row items-center">
            <LinkIcon
              size={12}
              className="mr-1 text-neutral-400 dark:text-neutral-100"
            />
            <Text
              className="text-sm leading-4 text-neutral-400 dark:text-neutral-100"
              numberOfLines={1}
            >
              {new URL(content.external.uri).hostname}
            </Text>
          </View>
          <Text
            className="mt-1 text-base leading-5"
            numberOfLines={depth === 0 ? 2 : 1}
          >
            {content.external.title || content.external.uri}
          </Text>
          {content.external.description &&
            depth === 0 &&
            !content.external.thumb && (
              <Text className="mt-0.5 text-sm leading-5" numberOfLines={2}>
                {content.external.description}
              </Text>
            )}
        </View>
      </View>
    </TouchableHighlight>
  );
};
