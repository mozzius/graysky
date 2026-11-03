import { memo, useMemo } from "react";
import { Alert, Platform, Share, View } from "react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import { useRouter, useSegments } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { deletePost } from "@bsky/sdk";
import { app, com } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { Menu } from "~/components/menu";
import { useAccountActions } from "~/lib/account-actions";
import { useAgent, useSession } from "~/lib/agent";
import { isType } from "~/lib/utils/types";
import { useLists } from "./lists/context";

interface Props {
  post: app.bsky.feed.defs.PostView & {
    record: app.bsky.feed.post.Main;
  };
  showSeeInfo?: boolean;
  showCopyText?: boolean;
  onTranslate?: () => void;
}

const PostContextMenuButton = ({
  post,
  showSeeInfo,
  showCopyText,
  onTranslate,
}: Props) => {
  const agent = useAgent();
  const session = useSession();
  const { openLikes, openReposts } = useLists();
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const segments = useSegments();
  const { _ } = useLingui();
  const { blockAccount, muteAccount } = useAccountActions();

  const rkey = post.uri.split("/").pop()!;

  const url = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;

  const translate = () => onTranslate?.();

  const share = async (mode: "link" | "capture" | "copy") => {
    switch (mode) {
      case "link":
        void Share.share(
          Platform.select({
            ios: { url },
            default: { message: url },
          }),
        );
        break;
      case "capture":
        router.push(`/capture/${post.author.handle}/${rkey}`);
        break;
      case "copy":
        if (Platform.OS === "ios") {
          await Clipboard.setUrlAsync(url);
        } else {
          await Clipboard.setStringAsync(url);
        }
        toast.success(_(msg`Copied link`), {
          description: _(msg`Post link copied to clipboard`),
        });
        break;
    }
  };

  const copy = async () => {
    if (!isType(app.bsky.feed.post, post.record)) return;
    await Clipboard.setStringAsync(post.record.text);
    toast.success(_(msg`Copied post text`), {
      description: _(msg`Post text copied to clipboard`),
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

          onPress: async () => {
            await agent.call(deletePost, post.uri);
            await queryClient.refetchQueries({
              queryKey: ["profile", post.author.did, "post", post.uri],
            });
            toast.error(_(msg`Post deleted`));
            if (segments.at(-1) === rkey) {
              router.back();
            }
          },
        },
      ],
    );
  };

  const report = async (reasonType: com.atproto.moderation.defs.ReasonType) => {
    await agent.call(
      com.atproto.moderation.createReport,
      {
        reasonType,
        subject: {
          $type: "com.atproto.repo.strongRef",
          uri: post.uri,
          cid: post.cid,
        },
      },
      // no proxy - the PDS forwards reports to its own report service
      { service: null },
    );
    toast.success(_(msg`Report submitted`), {
      description: _(msg`Thank you for making the skyline a safer place`),
    });
  };

  const reportOptions = useMemo(() => {
    // prettier-ignore
    return [
      { label: _(msg`Spam`), value: "com.atproto.moderation.defs#reasonSpam" as const },
      { label: _(msg`Illegal and Urgent`), value: "com.atproto.moderation.defs#reasonViolation" as const },
      { label: _(msg`Unwanted Sexual Content`), value: "com.atproto.moderation.defs#reasonSexual" as const },
      { label: _(msg`Anti-Social Behavior`), value: "com.atproto.moderation.defs#reasonRude" as const },
      { label: _(msg`Other`), value: "com.atproto.moderation.defs#reasonOther" as const },
    ]
  }, [_]);

  const isOwnPost = post.author.handle === session?.handle;

  return (
    <Menu
      accessibilityLabel={_(msg`Post options`)}
      groups={[
        {
          key: "main",
          items: [
            ...(onTranslate
              ? [
                  {
                    key: "translate",
                    label: _(msg`Translate post`),
                    icon: "character.book.closed",
                    onSelect: translate,
                  } as const,
                ]
              : []),
            {
              type: "submenu",
              key: "share",
              label: _(msg`Share post`),
              icon: "square.and.arrow.up",
              groups: [
                {
                  key: "share",
                  items: [
                    {
                      key: "share link",
                      label: _(msg`Share link to post`),
                      icon: "link",
                      onSelect: () => void share("link"),
                    },
                    {
                      key: "copy link",
                      label: _(msg`Copy link to post`),
                      icon: "doc.on.doc",
                      onSelect: () => void share("copy"),
                    },
                    {
                      key: "share image",
                      label: _(msg`Share as image`),
                      icon: "photo",
                      onSelect: () => void share("capture"),
                    },
                  ],
                },
              ],
            },
            ...(showCopyText
              ? [
                  {
                    key: "copy",
                    label: _(msg`Copy post text`),
                    icon: "doc.on.doc",
                    onSelect: () => void copy(),
                  } as const,
                ]
              : []),
          ],
        },
        showSeeInfo && {
          key: "info",
          items: [
            {
              key: "see likes",
              label: _(msg`See likes`),
              icon: "heart",
              onSelect: () => openLikes(post.uri),
            },
            {
              key: "see reposts",
              label: _(msg`See reposts`),
              icon: "repeat",
              onSelect: () => openReposts(post.uri),
            },
          ],
        },
        isOwnPost
          ? {
              key: "own",
              items: [
                {
                  key: "delete",
                  label: _(msg`Delete post`),
                  icon: "trash",
                  destructive: true,
                  onSelect: delet,
                },
              ],
            }
          : {
              key: "other",
              items: [
                {
                  key: "mute",
                  label: _(msg`Mute user`),
                  icon: "speaker.slash",
                  onSelect: () =>
                    muteAccount(post.author.did, post.author.handle),
                },
                {
                  key: "block",
                  label: _(msg`Block user`),
                  icon: "xmark.octagon",
                  onSelect: () =>
                    blockAccount(post.author.did, post.author.handle),
                },
                {
                  type: "submenu",
                  key: "report",
                  label: _(msg`Report post`),
                  icon: "flag",
                  groups: [
                    {
                      key: "reasons",
                      title: _(msg`What's the issue with this post?`),
                      items: reportOptions.map((option) => ({
                        key: option.value,
                        label: option.label,
                        onSelect: () => void report(option.value),
                      })),
                    },
                  ],
                },
              ],
            },
      ]}
    >
      <View className="-mt-2 px-3 py-2">
        <MoreHorizontalIcon size={16} color={theme.colors.text} />
      </View>
    </Menu>
  );
};

export const PostContextMenu = memo(PostContextMenuButton);
