import { memo } from "react";
import { Alert, Platform, Share, TouchableOpacity } from "react-native";
import { ContextMenuButton } from "react-native-ios-context-menu";
import { showToastable } from "react-native-toastable";
import * as Clipboard from "expo-clipboard";
import { useRouter, useSegments } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  CopyIcon,
  FlagIcon,
  HeartIcon,
  ImageIcon,
  LanguagesIcon,
  LinkIcon,
  MegaphoneOffIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  Share2Icon,
  Trash2Icon,
  XOctagonIcon,
} from "lucide-react-native";

import { useAccountActions } from "~/lib/account-actions";
import { useAgent } from "~/lib/agent";
import { useHaptics } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { useLists } from "./lists/context";

interface Props {
  post: AppBskyFeedDefs.PostView & { record: AppBskyFeedPost.Record };
  showSeeLikes?: boolean;
  showSeeReposts?: boolean;
  showCopyText?: boolean;
  onTranslate?: () => void;
}

const PostContextMenuButton = ({
  post,
  showSeeLikes,
  showSeeReposts,
  showCopyText,
  onTranslate,
}: Props) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const agent = useAgent();
  const { openLikes, openReposts } = useLists();
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const haptics = useHaptics();
  const segments = useSegments();
  const { _ } = useLingui();
  const { blockAccount, muteAccount } = useAccountActions();

  const rkey = post.uri.split("/").pop()!;

  const translate = () => onTranslate?.();

  const share = () => {
    const url = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
    const icons = [
      <LinkIcon key={0} size={24} color={theme.colors.text} />,
      <ImageIcon key={1} size={24} color={theme.colors.text} />,
    ];
    showActionSheetWithOptions(
      {
        options: [
          _(msg`Share link to post`),
          _(msg`Share as image`),
          _(msg`Cancel`),
        ],
        icons: [...icons, <></>],
        cancelButtonIndex: 2,
        ...actionSheetStyles(theme),
      },
      (index) => {
        switch (index) {
          case 0:
            void Share.share(
              Platform.select({
                ios: { url },
                default: { message: url },
              }),
            );
            break;
          case 1:
            router.push(`/capture/${post.author.handle}/${rkey}`);
        }
      },
    );
  };

  const copy = async () => {
    if (!AppBskyFeedPost.isRecord(post.record)) return;
    await Clipboard.setStringAsync(post.record.text);
    showToastable({
      title: _(msg`Copied post text`),
      message: _(msg`Post text copied to clipboard`),
    });
  };

  const delet = () => {
    Alert.alert(
      _(msg`Delete`),
      _(msg`Are you sure you want to delete this post?`),
      [
        {
          text: _(msg`Cancel`),
          style: "cancel",
        },
        {
          text: _(msg`Delete`),
          style: "destructive",
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onPress: async () => {
            await agent.deletePost(post.uri);
            await queryClient.refetchQueries({
              queryKey: ["profile", post.author.did, "post", post.uri],
            });
            showToastable({
              message: _(msg`Post deleted`),
              status: "danger",
            });
            if (segments.at(-1) === rkey) {
              router.back();
            }
          },
        },
      ],
    );
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
        ...actionSheetStyles(theme),
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
    onTranslate
      ? {
          key: "translate",
          label: _(msg`Translate`),
          action: () => translate(),
          icon: "character.book.closed",
          reactIcon: <LanguagesIcon size={24} color={theme.colors.text} />,
        }
      : [],
    {
      key: "share",
      label: _(msg`Share post`),
      action: () => share(),
      icon: "square.and.arrow.up",
      reactIcon: <Share2Icon size={24} color={theme.colors.text} />,
    },
    showCopyText
      ? {
          key: "copy",
          label: _(msg`Copy post text`),
          action: () => copy(),
          icon: "doc.on.doc",
          reactIcon: <CopyIcon size={24} color={theme.colors.text} />,
        }
      : [],
    showSeeLikes
      ? {
          key: "likes",
          label: _(msg`See likes`),
          action: () => openLikes(post.uri),
          icon: "heart",
          reactIcon: <HeartIcon size={24} color={theme.colors.text} />,
        }
      : [],
    showSeeReposts
      ? {
          key: "reposts",
          label: _(msg`See reposts`),
          action: () => openReposts(post.uri),
          icon: "arrow.2.squarepath",
          reactIcon: <RepeatIcon size={24} color={theme.colors.text} />,
        }
      : [],
    post.author.handle === agent.session?.handle
      ? {
          key: "delete",
          label: _(msg`Delete post`),
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
                label: _(msg`Mute user`),
                action: () => muteAccount(post.author.did, post.author.handle),
                icon: "speaker.slash",
                reactIcon: (
                  <MegaphoneOffIcon size={24} color={theme.colors.text} />
                ),
              },
          post.author.viewer?.blocking
            ? []
            : {
                key: "block",
                label: _(msg`Block user`),
                action: () => blockAccount(post.author.did, post.author.handle),
                icon: "xmark.octagon",
                reactIcon: <XOctagonIcon size={24} color={theme.colors.text} />,
              },
          {
            key: "report",
            label: _(msg`Report post`),
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
        options: [...options.map((x) => x.label), _(msg`Cancel`)],
        icons: [...options.map((x) => x.reactIcon), <></>],
        cancelButtonIndex: options.length,
        ...actionSheetStyles(theme),
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
      accessibilityLabel={_(msg`Post options`)}
      accessibilityRole="button"
      className="px-3 pb-2"
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
      accessibilityLabel={_(msg`Post options`)}
      accessibilityRole="button"
      hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
      onPress={showAsActionSheet}
    >
      {icon}
    </TouchableOpacity>
  );
};

export const PostContextMenu = memo(PostContextMenuButton);
