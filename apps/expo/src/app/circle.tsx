import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import { Image, type ImageSource } from "expo-image";
import { Stack, useRouter } from "expo-router";
import {
  AppBskyFeedLike,
  RichText as RichTextHelper,
  type BskyAgent,
} from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { XIcon } from "lucide-react-native";

import { Avatar } from "~/components/avatar";
import { RichText } from "~/components/rich-text";
import KeyboardAwareScrollView from "~/components/scrollview/keyboard-aware-scrollview";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useSelf } from "./settings/account";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require("../../assets/icon.png") as ImageSource;

export default function MyCircle() {
  const self = useSelf();
  const agent = useAgent();
  const theme = useTheme();
  const captureRef = useRef<ViewShot>(null!);
  const router = useRouter();
  const { _ } = useLingui();
  const [text, setText] = useState("");

  const friends = useMutation({
    mutationKey: ["friends"],
    mutationFn: async () => {
      const [potentialFriends, outgoingLikes, outgoingReposts] =
        await Promise.all([
          getNotifications(agent),
          getRecords(agent, "app.bsky.feed.like"),
          getRecords(agent, "app.bsky.feed.repost"),
        ]);

      for (const [did, count] of Object.entries(outgoingLikes)) {
        potentialFriends[did] = (potentialFriends[did] || 0) + count * 2;
      }

      for (const [did, count] of Object.entries(outgoingReposts)) {
        potentialFriends[did] = (potentialFriends[did] || 0) + count * 6;
      }

      const profiles = await agent.getProfiles({
        actors: Object.entries(potentialFriends)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 25)
          .map(([did]) => did),
      });

      return profiles.data.profiles
        .filter(
          (profile) =>
            !(
              profile.viewer?.blocking ||
              profile.viewer?.blockedBy ||
              profile.viewer?.muted
            ),
        )
        .slice(0, 10);
    },
  });

  const postCircle = useMutation({
    mutationKey: ["post", "circle"],
    mutationFn: async () => {
      if (!captureRef.current?.capture)
        throw new Error("Not able to capture image");
      const uri = await captureRef.current.capture();
      if (!uri) throw new Error("Failed to capture circle");

      const tempPath = `${FileSystem.cacheDirectory}circle-${String(Math.random()).slice(2)}.jpg`;

      // move uri to temp dir
      await FileSystem.copyAsync({
        from: uri,
        to: tempPath,
      });

      const blob = await agent.uploadBlob(tempPath, {
        encoding: "image/jpeg",
      });

      const rt = new RichTextHelper({ text });
      await rt.detectFacets(agent);

      await agent.post({
        text: rt.text,
        facets: rt.facets,
        labels: {
          $type: "com.atproto.label.defs#selfLabels",
          values: ["graysky.app", "circle"].map((val) => ({ val })),
        },
        embed: {
          $type: "app.bsky.embed.images",
          images: [
            {
              image: blob.data.blob,
              alt:
                "Circle of friends\n\n" +
                friends.data?.map((friend) => "@" + friend.handle).join("\n"),
              aspectRatio: {
                height: 1,
                width: 1,
              },
            },
          ],
        },
      });
    },
    onSuccess: () => {
      router.navigate("../");
      showToastable({
        message: "Circle posted",
      });
    },
    onError: (error) => console.error(error),
  });

  const rt = useMemo(() => {
    const rt = new RichTextHelper({ text });
    rt.detectFacetsWithoutResolution();
    return rt;
  }, [text]);

  return (
    <TransparentHeaderUntilScrolled>
      <KeyboardAwareScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.colors.card }}
      >
        <StatusBar modal />
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerRight: () => (
              <TouchableHighlight
                className="rounded-full"
                onPress={() => router.push("../")}
              >
                <View
                  className="flex-1 rounded-full p-2"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <XIcon color={theme.colors.text} size={18} strokeWidth={3} />
                </View>
              </TouchableHighlight>
            ),
          }}
        />
        <ViewShot
          ref={captureRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={{
            backgroundColor: theme.colors.card,
            flex: 1,
          }}
        >
          <View className="relative aspect-square flex-1 items-center justify-center">
            {friends.isPending ? (
              <ActivityIndicator size="large" />
            ) : (
              <Avatar className="h-[25%] w-[25%]" uri={self.data?.avatar} />
            )}
            {/* position avatars in a circle around the central one */}
            {friends.data?.map((friend, index, arr) => {
              const numberOfFriends = arr.length;
              return (
                <Avatar
                  key={friend.did}
                  className="absolute h-[15%] w-[15%]"
                  uri={friend.avatar}
                  style={{
                    left: `${42.5 + 30 * Math.cos((2 * Math.PI * index) / numberOfFriends)}%`,
                    top: `${42.5 + 30 * Math.sin((2 * Math.PI * index) / numberOfFriends)}%`,
                  }}
                />
              );
            })}
            <View className="absolute bottom-1 right-1.5 flex-row items-center">
              <Image className="ml-2 mr-1 h-3 w-3 rounded" source={appIcon} />
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                graysky.app
              </Text>
            </View>
          </View>
        </ViewShot>
        {friends.isSuccess && (
          <Animated.View className="mt-2 flex-1 px-4" layout={LinearTransition}>
            <TextInput
              value={text}
              onChange={(evt) => setText(evt.nativeEvent.text)}
              multiline
              className="min-h-[80px] flex-1 rounded-md p-2 text-base leading-5"
              scrollEnabled={false}
              style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              }}
              textAlignVertical="top"
              placeholder={_(msg`Post text (optional)`)}
              maxLength={300}
            >
              <RichText
                size="base"
                text={rt.text}
                facets={rt.facets}
                truncate={false}
                disableLinks
                selectable={false}
                uiTextView={false}
              />
            </TextInput>
          </Animated.View>
        )}
        <Animated.View className="mt-2 flex-1 p-4" layout={LinearTransition}>
          <TouchableHighlight
            className="rounded-xl"
            style={{ borderCurve: "continuous" }}
            disabled={friends.isPending || postCircle.isPending}
            onPress={() =>
              friends.isSuccess ? postCircle.mutate() : friends.mutate()
            }
          >
            <View
              className="w-full items-center rounded-xl py-3"
              style={{
                borderCurve: "continuous",
                backgroundColor:
                  friends.isPending || postCircle.isPending
                    ? theme.colors.border
                    : theme.colors.primary,
              }}
            >
              <Text className="text-center text-base font-medium text-white">
                {friends.isSuccess ? (
                  <Trans>Post circle</Trans>
                ) : (
                  <Trans>Fetch connections</Trans>
                )}
              </Text>
            </View>
          </TouchableHighlight>
        </Animated.View>
      </KeyboardAwareScrollView>
    </TransparentHeaderUntilScrolled>
  );
}

async function getNotifications(agent: BskyAgent) {
  let isOlderThanAWeek = false;
  let cursor: string | undefined;

  const potentialFriends: Record<string, number> = {};

  do {
    const notifications = await agent.app.bsky.notification.listNotifications({
      cursor,
      limit: 100,
    });
    cursor = notifications.data.cursor;
    for (const notification of notifications.data.notifications) {
      const date = notification?.indexedAt;
      if (
        date &&
        new Date(date).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
      ) {
        isOlderThanAWeek = true;
        break;
      }

      let score = 0;

      switch (notification.reason) {
        case "like":
          score = 1;
          break;
        case "reply":
          score = 3;
          break;
        case "mention":
          score = 3;
          break;
        case "retweet":
          score = 5;
          break;
      }

      if (score > 0) {
        potentialFriends[notification.author.did] =
          (potentialFriends[notification.author.did] || 0) + score;
      }
    }
  } while (!isOlderThanAWeek && cursor);

  return potentialFriends;
}

async function getRecords(agent: BskyAgent, collection: string) {
  let isOlderThanAWeek = false;
  let cursor: string | undefined;

  const potentialFriends: Record<string, number> = {};

  do {
    const records = await agent.com.atproto.repo.listRecords({
      collection,
      repo: agent.session!.did,
      cursor,
      limit: 100,
    });
    cursor = records.data.cursor;
    for (const record of records.data.records) {
      if (AppBskyFeedLike.isRecord(record.value)) {
        const date = record.value.createdAt;
        if (
          date &&
          new Date(date).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
        ) {
          isOlderThanAWeek = true;
          break;
        }

        const [, , did] = record.value.subject.uri.split("/");

        potentialFriends[did!] = (potentialFriends[did!] || 0) + 1;
      }
    }
  } while (!isOlderThanAWeek && cursor);

  return potentialFriends;
}
