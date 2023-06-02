import { useEffect } from "react";
import {
  Alert,
  Button,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import {
  ComAtprotoModerationDefs,
  type AppBskyActorDefs,
  type AppBskyEmbedImages,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, MoreHorizontal, Plus } from "lucide-react-native";

import { blockAccount, muteAccount } from "../lib/account-actions";
import { useAuthedAgent } from "../lib/agent";
import { useColorScheme } from "../lib/utils/color-scheme";
import { cx } from "../lib/utils/cx";
import { useLists } from "./lists/context";
import { RichTextWithoutFacets } from "./rich-text";

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed;
  backButton?: boolean;
}

export const ProfileInfo = ({ profile, backButton }: Props) => {
  const agent = useAuthedAgent();
  const router = useRouter();
  const { openFollows, openFollowers } = useLists();
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();

  const toggleFollow = useMutation({
    mutationKey: ["follow", profile.did],
    mutationFn: async () => {
      if (profile.viewer?.following) {
        await agent.deleteFollow(profile.viewer?.following);
      } else {
        await agent.follow(profile.did);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries(["profile"]);
      void queryClient.invalidateQueries(["network"]);
    },
  });

  useEffect(() => {
    if (profile.avatar) {
      queryClient.setQueryData(
        ["images", profile.did],
        [
          {
            alt: profile.displayName ?? `@${profile.handle}`,
            fullsize: profile.avatar,
            thumb: profile.avatar,
          } satisfies AppBskyEmbedImages.ViewImage,
        ],
      );
    }
  }, [profile, queryClient]);

  return (
    <View className="relative">
      <Image source={{ uri: profile.banner }} className="h-32 w-full" alt="" />
      {backButton && (
        <TouchableOpacity
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          className="absolute left-4 top-4 items-center justify-center rounded-full bg-black/60 p-2"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
      )}
      <View className="relative bg-white px-4 pb-1 dark:bg-[#121212]">
        <View className="h-10 flex-row items-center justify-end">
          <Link asChild href={`/images/${profile.did}`}>
            <TouchableOpacity className="absolute -top-11 left-0 rounded-full border-2 border-white bg-white dark:border-black dark:bg-black">
              <Image
                source={{ uri: profile.avatar }}
                className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800"
                alt=""
              />
            </TouchableOpacity>
          </Link>
          {agent.session?.handle !== profile.handle ? (
            <View className="flex-row justify-end">
              <TouchableOpacity
                disabled={toggleFollow.isLoading}
                onPress={() => toggleFollow.mutate()}
                className={cx(
                  "min-w-[120px] flex-row items-center justify-center rounded-full px-2 py-1.5",
                  profile.viewer?.following
                    ? "bg-neutral-200 dark:bg-neutral-700"
                    : "bg-black dark:bg-white",
                  toggleFollow.isLoading && "opacity-50",
                )}
              >
                {profile.viewer?.following ? (
                  <>
                    <Check size={18} className="mr-1 text-neutral-600" />
                    <Text className="font-medium text-neutral-600 dark:text-neutral-300">
                      Following
                    </Text>
                  </>
                ) : (
                  <>
                    <Plus
                      size={18}
                      className="mr-1 text-white dark:text-black"
                    />
                    <Text className="font-medium text-white dark:text-black">
                      Follow
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="ml-1 rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                onPress={() => {
                  const options = [
                    "Share",
                    "Mute Account",
                    "Block Account",
                    "Report Account",
                    "Cancel",
                  ];
                  showActionSheetWithOptions(
                    {
                      options,
                      cancelButtonIndex: options.length - 1,
                      userInterfaceStyle: colorScheme,
                    },
                    (index) => {
                      if (index === undefined) return;
                      const option = options[index];
                      switch (option) {
                        case "Share":
                          void Share.share({
                            message: `https://bsky.app/profile/${profile.handle}`,
                          });
                          break;
                        case "Mute Account":
                          muteAccount(agent, profile.handle, profile.did);
                          break;
                        case "Block Account":
                          blockAccount(agent, profile.handle, profile.did);

                          break;
                        case "Report Account":
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
                              title: "What is the issue with this account?",
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
                                  did: profile.did,
                                },
                              });
                              Alert.alert(
                                "Report submitted",
                                "Thank you for making the skyline a safer place.",
                              );
                            },
                          );
                          break;
                      }
                    },
                  );
                }}
              >
                <MoreHorizontal
                  size={18}
                  className="text-neutral-600 dark:text-neutral-300"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
              onPress={() => {
                const options = ["Edit Profile", "Share", "Cancel"];
                showActionSheetWithOptions(
                  {
                    options,
                    cancelButtonIndex: options.length - 1,
                    userInterfaceStyle: colorScheme,
                  },
                  (index) => {
                    if (index === undefined) return;
                    const option = options[index];
                    switch (option) {
                      case "Edit Profile":
                        router.push("/settings/account/edit-bio");
                        break;
                      case "Share":
                        void Share.share({
                          message: `https://bsky.app/profile/${profile.handle}`,
                        });
                        break;
                    }
                  },
                );
              }}
            >
              <MoreHorizontal
                size={18}
                className="text-neutral-600 dark:text-neutral-300"
              />
            </TouchableOpacity>
          )}
        </View>
        <Text className="mt-1 text-2xl font-medium dark:text-white">
          {profile.displayName}
        </Text>
        <Text>
          {profile.viewer?.followedBy && (
            <>
              <Text className="bg-neutral-100 px-1 font-semibold dark:bg-neutral-900">
                <Text className="dark:text-white">{" Follows you "}</Text>
              </Text>{" "}
            </>
          )}
          <Text className="text-neutral-500 dark:text-neutral-400">
            @{profile.handle}
          </Text>
        </Text>
        <View className="mt-3 flex-row">
          <TouchableOpacity onPress={() => openFollowers(profile.did)}>
            <Text className="dark:text-white">
              <Text className="font-bold">{profile.followersCount}</Text>{" "}
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openFollows(profile.did)}>
            <Text className="ml-4 dark:text-white">
              <Text className="font-bold">{profile.followsCount}</Text>{" "}
              Following
            </Text>
          </TouchableOpacity>
          <Text className="ml-4 dark:text-white">
            <Text className="font-bold">{profile.postsCount ?? 0}</Text> Posts
          </Text>
        </View>
        {profile.description && (
          <View className="mt-3">
            <RichTextWithoutFacets text={profile.description} />
          </View>
        )}
        {profile.viewer?.muted && (
          <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
            <Text className="font-semibold dark:text-white">
              You have muted this user
            </Text>
            <Button
              title="Unmute"
              onPress={() => {
                void agent.unmute(profile.did).then(() => {
                  void queryClient.invalidateQueries([
                    "profile",
                    profile.handle,
                  ]);
                  void queryClient.invalidateQueries(["profile", profile.did]);
                });
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
};
