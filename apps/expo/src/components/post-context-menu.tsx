import { memo, useMemo } from "react";
import { Alert, Platform, Share, View } from "react-native";
import { showToastable } from "react-native-toastable";
import * as Clipboard from "expo-clipboard";
import { useRouter, useSegments } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";
import * as DropdownMenu from "zeego/dropdown-menu";

import { useAccountActions } from "~/lib/account-actions";
import { useAgent } from "~/lib/agent";
import { useLists } from "./lists/context";

interface Props {
  post: AppBskyFeedDefs.PostView & { record: AppBskyFeedPost.Record };
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
        await Platform.select({
          ios: Clipboard.setUrlAsync(url),
          default: Clipboard.setStringAsync(url) as Promise<unknown>,
        });
        showToastable({
          title: _(msg`Copied link`),
          message: _(msg`Post link copied to clipboard`),
        });
        break;
    }
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

  const report = async (reasonType: ComAtprotoModerationDefs.ReasonType) => {
    await agent.createModerationReport({
      reasonType,
      subject: {
        $type: "com.atproto.repo.strongRef",
        uri: post.uri,
        cid: post.cid,
      },
    });
    showToastable({
      title: _(msg`Report submitted`),
      message: _(msg`Thank you for making the skyline a safer place`),
    });
  };

  const reportOptions = useMemo(() => {
    // prettier-ignore
    return [
      { label: _(msg`Spam`), value: ComAtprotoModerationDefs.REASONSPAM },
      { label: _(msg`Illegal and Urgent`), value: ComAtprotoModerationDefs.REASONVIOLATION },
      { label: _(msg`Unwanted Sexual Content`), value: ComAtprotoModerationDefs.REASONSEXUAL },
      { label: _(msg`Anti-Social Behavior`), value: ComAtprotoModerationDefs.REASONRUDE },
      { label: _(msg`Other`), value: ComAtprotoModerationDefs.REASONOTHER },
    ]
  }, [_]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="-mt-2 px-3 py-2">
          <MoreHorizontalIcon size={16} color={theme.colors.text} />
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          {onTranslate && (
            <DropdownMenu.Item
              key="translate"
              textValue={_(msg`Translate post`)}
              onSelect={translate}
            >
              <DropdownMenu.ItemIcon ios={{ name: "character.book.closed" }} />
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger key="share" textValue={_(msg`Share post`)}>
              <DropdownMenu.ItemIcon ios={{ name: "square.and.arrow.up" }} />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Item
                key="share link"
                textValue={_(msg`Share link to post`)}
                onSelect={() => share("link")}
              >
                <DropdownMenu.ItemIcon ios={{ name: "link" }} />
              </DropdownMenu.Item>
              <DropdownMenu.Item
                key="copy link"
                textValue={_(msg`Copy link to post`)}
                onSelect={() => share("link")}
              >
                <DropdownMenu.ItemIcon ios={{ name: "doc.on.doc" }} />
              </DropdownMenu.Item>
              <DropdownMenu.Item
                key="share image"
                textValue={_(msg`Share as image`)}
                onSelect={() => share("capture")}
              >
                <DropdownMenu.ItemIcon ios={{ name: "photo" }} />
              </DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          {showCopyText && (
            <DropdownMenu.Item
              key="copy"
              textValue={_(msg`Copy post text`)}
              onSelect={copy}
            >
              <DropdownMenu.ItemIcon ios={{ name: "doc.on.doc" }} />
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Group>
        {showSeeInfo && (
          <DropdownMenu.Group>
            <DropdownMenu.Item
              key="see likes"
              textValue={_(msg`See likes`)}
              onSelect={() => openLikes(post.uri)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "heart" }} />
            </DropdownMenu.Item>
            <DropdownMenu.Item
              key="see reposts"
              textValue={_(msg`See reposts`)}
              onSelect={() => openReposts(post.uri)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "repeat" }} />
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        )}
        {post.author.handle === agent.session?.handle ? (
          <DropdownMenu.Group>
            <DropdownMenu.Item
              key="delete"
              textValue={_(msg`Delete post`)}
              onSelect={delet}
              destructive
            >
              <DropdownMenu.ItemIcon ios={{ name: "trash" }} />
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        ) : (
          <DropdownMenu.Group>
            <DropdownMenu.Item
              key="mute"
              textValue={_(msg`Mute user`)}
              onSelect={() => muteAccount(post.author.did, post.author.handle)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "speaker.slash" }} />
            </DropdownMenu.Item>
            <DropdownMenu.Item
              key="block"
              textValue={_(msg`Block user`)}
              onSelect={() => blockAccount(post.author.did, post.author.handle)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "xmark.octagon" }} />
            </DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger
                key="report"
                textValue={_(msg`Report post`)}
              >
                <DropdownMenu.ItemIcon ios={{ name: "flag" }} />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Label>
                  {_(msg`What's the issue with this post?`)}
                </DropdownMenu.Label>
                {reportOptions.map((option) => (
                  <DropdownMenu.Item
                    key={option.value}
                    onSelect={() => report(option.value)}
                  >
                    <DropdownMenu.ItemTitle>
                      {option.label}
                    </DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Group>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export const PostContextMenu = memo(PostContextMenuButton);
