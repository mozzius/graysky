import { memo } from "react";
import { Alert, Platform, Share, TouchableOpacity } from "react-native";
import { ContextMenuButton } from "react-native-ios-context-menu";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { blockAccount, muteAccount } from "../lib/account-actions";
import { useAgent } from "../lib/agent";
import { assert } from "../lib/utils/assert";
import { useLists } from "./lists/context";

interface Props {
  post: AppBskyFeedDefs.PostView;
}

const PostContextMenuButton = ({ post }: Props) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  const agent = useAgent();
  const { openLikes, openReposts } = useLists();
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const translate = () => {
    if (!AppBskyFeedPost.isRecord(post.record)) return;
    assert(AppBskyFeedPost.validateRecord(post.record));
    router.push(`/translate?text=${encodeURIComponent(post.record.text)}`);
  };

  const copy = async () => {
    if (!AppBskyFeedPost.isRecord(post.record)) return;
    assert(AppBskyFeedPost.validateRecord(post.record));
    await Clipboard.setStringAsync(post.record.text);
  };

  const share = () => {
    void Share.share({
      message: `https://bsky.app/profile/${post.author.handle}/post/${post.uri
        .split("/")
        .pop()}`,
    });
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
          Alert.alert("Deleted", "Your post has been deleted.");
          await queryClient.invalidateQueries();
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
      },
      async (index) => {
        if (index === undefined) return;
        const reason = reportOptions[index]!.value;
        if (reason === "Cancel") return;
        await agent.createModerationReport({
          reasonType: reason,
          subject: {
            uri: post.uri,
            cid: post.cid,
          },
        });
        Alert.alert(
          "Report submitted",
          "Thank you for making the skyline a safer place.",
        );
      },
    );
  };

  const options = [
    {
      key: "translate",
      label: "Translate",
      action: () => translate(),
      icon: "character.bubble",
    },
    {
      key: "share",
      label: "Share post",
      action: () => share(),
      icon: "square.and.arrow.up",
    },
    {
      key: "likes",
      label: "See likes",
      action: () => openLikes(post.uri),
      icon: "heart",
    },
    {
      key: "reposts",
      label: "See reposts",
      action: () => openReposts(post.uri),
      icon: "arrow.2.squarepath",
    },
    post.author.handle === agent.session?.handle
      ? {
          key: "delete",
          label: "Delete post",
          action: () => delet(),
          icon: "trash",
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
              },
          {
            key: "report",
            label: "Report post",
            action: () => report(),
            icon: "flag",
          },
        ],
  ].flat(2);

  const icon = <MoreHorizontalIcon size={16} color={theme.colors.text} />;

  const showAsActionSheet = () => {
    void Haptics.impactAsync();
    showActionSheetWithOptions(
      {
        options: [...options.map((x) => x.label), "Cancel"],
        cancelButtonIndex: options.length,
        userInterfaceStyle: colorScheme,
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
      accessibilityLabel="Post context menu"
      accessibilityRole="button"
      hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
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
      accessibilityLabel="More options"
      accessibilityRole="button"
      hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
      onPress={showAsActionSheet}
    >
      {icon}
    </TouchableOpacity>
  );
};

export const PostContextMenu = memo(PostContextMenuButton);
