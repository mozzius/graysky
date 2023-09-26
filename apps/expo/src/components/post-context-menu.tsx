import { memo } from "react";
import { Alert, Platform, Share, TouchableOpacity } from "react-native";
import { ContextMenuButton } from "react-native-ios-context-menu";
import { showToastable } from "react-native-toastable";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  CopyIcon,
  FlagIcon,
  HeartIcon,
  LanguagesIcon,
  MegaphoneOffIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  Share2Icon,
  Trash2Icon,
  XOctagonIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { blockAccount, muteAccount } from "~/lib/account-actions";
import { useAgent } from "~/lib/agent";
import { useHaptics } from "~/lib/hooks/preferences";
import { useLists } from "./lists/context";

interface Props {
  post: AppBskyFeedDefs.PostView;
  showSeeLikes?: boolean;
  showSeeReposts?: boolean;
  showCopyText?: boolean;
}

const PostContextMenuButton = ({
  post,
  showSeeLikes,
  showSeeReposts,
  showCopyText,
}: Props) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  const agent = useAgent();
  const { openLikes, openReposts } = useLists();
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const haptics = useHaptics();

  const translate = () => {
    if (!AppBskyFeedPost.isRecord(post.record)) return;
    router.push(`/translate?text=${encodeURIComponent(post.record.text)}`);
  };

  const share = () => {
    const url = `https://bsky.app/profile/${post.author.handle}/post/${post.uri
      .split("/")
      .pop()}`;
    void Share.share(
      Platform.select({
        ios: { url },
        default: { message: url },
      }),
    );
  };

  const copy = async () => {
    if (!AppBskyFeedPost.isRecord(post.record)) return;
    await Clipboard.setStringAsync(post.record.text);
  };

  const delet = () => {
    Alert.alert("Delete", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress: async () => {
          await agent.deletePost(post.uri);
          void queryClient.invalidateQueries();
          showToastable({
            message: "Post deleted",
          });
        },
      },
    ]);
  };

  const report = () => {
    // prettier-ignore
    const reportOptions = [
        { label: "Spam", value: ComAtprotoModerationDefs.REASONSPAM },
        { label: "Copyright Violation", value: ComAtprotoModerationDefs.REASONVIOLATION },
        { label: "Misleading", value: ComAtprotoModerationDefs.REASONMISLEADING },
        { label: "Unwanted Sexual Content", value: ComAtprotoModerationDefs.REASONSEXUAL },
        { label: "Rude", value: ComAtprotoModerationDefs.REASONRUDE },
        { label: "Other", value: ComAtprotoModerationDefs.REASONOTHER },
        { label: "Cancel", value: "Cancel" },
      ] as const;
    showActionSheetWithOptions(
      {
        title: "What is the issue with this post?",
        options: reportOptions.map((x) => x.label),
        cancelButtonIndex: reportOptions.length - 1,
        userInterfaceStyle: colorScheme,
        textStyle: { color: theme.colors.text },
        containerStyle: { backgroundColor: theme.colors.card },
      },
      async (index) => {
        if (index === undefined) return;
        const reason = reportOptions[index]!.value;
        if (reason === "Cancel") return;
        await agent.createModerationReport({
          reasonType: reason,
          subject: {
            $type: "com.atproto.repo.strongRef",
            uri: post.uri,
            cid: post.cid,
          },
        });
        showToastable({
          title: "Report submitted",
          message: "Thank you for making the skyline a safer place",
        });
      },
    );
  };

  const options: {
    key: string;
    label: string;
    action: () => void;
    icon: string;
    destructive?: boolean;
    reactIcon: JSX.Element;
  }[] = [
    {
      key: "translate",
      label: "Translate",
      action: () => translate(),
      icon: "character.book.closed",
      reactIcon: <LanguagesIcon size={24} color={theme.colors.text} />,
    },
    {
      key: "share",
      label: "Share post",
      action: () => share(),
      icon: "square.and.arrow.up",
      reactIcon: <Share2Icon size={24} color={theme.colors.text} />,
    },
    showCopyText
      ? {
          key: "copy",
          label: "Copy post text",
          action: () => copy(),
          icon: "doc.on.doc",
          reactIcon: <CopyIcon size={24} color={theme.colors.text} />,
        }
      : [],
    showSeeLikes
      ? {
          key: "likes",
          label: "See likes",
          action: () => openLikes(post.uri),
          icon: "heart",
          reactIcon: <HeartIcon size={24} color={theme.colors.text} />,
        }
      : [],
    showSeeReposts
      ? {
          key: "reposts",
          label: "See reposts",
          action: () => openReposts(post.uri),
          icon: "arrow.2.squarepath",
          reactIcon: <RepeatIcon size={24} color={theme.colors.text} />,
        }
      : [],
    post.author.handle === agent.session?.handle
      ? {
          key: "delete",
          label: "Delete post",
          action: () => delet(),
          icon: "trash",
          destructive: true,
          reactIcon: <Trash2Icon size={24} color={theme.colors.text} />,
        }
      : [
          post.author.viewer?.muted
            ? []
            : {
                key: "mute",
                label: "Mute user",
                action: () =>
                  muteAccount(
                    agent,
                    post.author.handle,
                    post.author.did,
                    queryClient,
                  ),
                icon: "speaker.slash",
                reactIcon: (
                  <MegaphoneOffIcon size={24} color={theme.colors.text} />
                ),
              },
          post.author.viewer?.blocking
            ? []
            : {
                key: "block",
                label: "Block user",
                action: () =>
                  blockAccount(
                    agent,
                    post.author.handle,
                    post.author.did,
                    queryClient,
                  ),
                icon: "xmark.octagon",
                reactIcon: <XOctagonIcon size={24} color={theme.colors.text} />,
              },
          {
            key: "report",
            label: "Report post",
            action: () => report(),
            icon: "flag",
            reactIcon: <FlagIcon size={24} color={theme.colors.text} />,
          },
        ],
  ].flat(2);

  const icon = <MoreHorizontalIcon size={16} color={theme.colors.text} />;

  const showAsActionSheet = () => {
    haptics.impact();
    showActionSheetWithOptions(
      {
        options: [...options.map((x) => x.label), "Cancel"],
        icons: [...options.map((x) => x.reactIcon), <></>],
        cancelButtonIndex: options.length,
        userInterfaceStyle: colorScheme,
        textStyle: { color: theme.colors.text },
        containerStyle: { backgroundColor: theme.colors.card },
      },
      (index) => {
        if (index === undefined) return;
        options[index]?.action();
      },
    );
  };

  return Platform.OS === "ios" ? (
    <ContextMenuButton
      isMenuPrimaryAction={true}
      accessibilityLabel="Post options"
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 20, left: 10, right: 20 }}
      menuConfig={{
        menuTitle: "",
        menuItems: options.map((x) => ({
          actionKey: x.key,
          actionTitle: x.label,
          icon: {
            type: "IMAGE_SYSTEM",
            imageValue: {
              systemName: x.icon,
            },
          },
          menuOptions: x.destructive ? ["destructive"] : undefined,
        })),
      }}
      onPressMenuItem={(evt) => {
        const key = evt.nativeEvent.actionKey;
        const option = options.find((x) => x.key === key);
        option?.action();
      }}
    >
      {icon}
    </ContextMenuButton>
  ) : (
    <TouchableOpacity
      accessibilityLabel="Post options"
      accessibilityRole="button"
      hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
      onPress={showAsActionSheet}
    >
      {icon}
    </TouchableOpacity>
  );
};

export const PostContextMenu = memo(PostContextMenuButton);
