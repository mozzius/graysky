import { useRef } from "react";
import {
  findNodeHandle,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { HeartIcon, MessageSquareIcon, RepeatIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { useComposer } from "~/lib/composer/utils";
import { useHandleRepost, useLike, useRepost } from "~/lib/hooks";
import { cx } from "~/lib/utils/cx";
import { Text } from "./text";

interface Props {
  post: AppBskyFeedDefs.PostView;
  dataUpdatedAt: number;
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const PostActionRow = ({
  post,
  dataUpdatedAt,
  children,
  className,
  style,
}: Props) => {
  const theme = useTheme();
  const { liked, likeCount, toggleLike } = useLike(post, dataUpdatedAt);
  const { reposted, repostCount, toggleRepost } = useRepost(
    post,
    dataUpdatedAt,
  );

  const composer = useComposer();
  const anchorRef = useRef<TouchableOpacity>(null!);

  const handleRepost = useHandleRepost(
    post,
    reposted,
    toggleRepost.mutate,
    (anchorRef.current && findNodeHandle(anchorRef.current)) ?? undefined,
  );

  return (
    <View
      className={cx(
        "mt-2 max-w-sm flex-row items-center justify-between pr-6",
        className,
      )}
      style={style}
    >
      <TouchableOpacity
        accessibilityLabel={`Reply, ${post.replyCount} repl${
          post.replyCount !== 1 ? "ies" : "y"
        }`}
        accessibilityRole="button"
        onPress={() => composer.reply(post)}
        className={cx(
          "flex-row items-center gap-2 pb-1.5 pr-2",
          !!post.viewer?.replyDisabled && "opacity-50",
        )}
      >
        <MessageSquareIcon size={16} color={theme.colors.text} />
        <Text className="tabular-nums">{post.replyCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={`Repost, ${repostCount} repost${
          repostCount !== 1 ? "s" : ""
        }`}
        accessibilityRole="button"
        disabled={toggleRepost.isPending}
        onPress={handleRepost}
        className="min-w-[50px] flex-row items-center gap-2 pb-1.5 pr-2"
        ref={anchorRef}
      >
        <RepeatIcon
          size={16}
          color={
            reposted
              ? theme.dark
                ? colors.green[400]
                : colors.green[600]
              : theme.colors.text
          }
        />
        <Text
          style={{
            color: reposted
              ? theme.dark
                ? colors.green[400]
                : colors.green[600]
              : theme.colors.text,
          }}
          className={cx("tabular-nums", reposted && "font-bold")}
        >
          {repostCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={`Like, ${likeCount} like${
          likeCount !== 1 ? "s" : ""
        }`}
        accessibilityRole="button"
        disabled={toggleLike.isPending}
        onPress={() => toggleLike.mutate()}
        className="min-w-[50px] flex-row items-center gap-2 pb-1.5 pr-2"
      >
        <HeartIcon
          size={16}
          fill={liked ? colors.red[600] : "transparent"}
          color={liked ? colors.red[600] : theme.colors.text}
        />
        <Text
          style={{
            color: liked ? colors.red[600] : theme.colors.text,
          }}
          className={cx("tabular-nums", liked && "font-bold")}
        >
          {likeCount}
        </Text>
      </TouchableOpacity>
      {children}
    </View>
  );
};
