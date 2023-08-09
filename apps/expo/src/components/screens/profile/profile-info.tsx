import { useEffect } from "react";
import {
  Alert,
  Button,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import {
  ComAtprotoModerationDefs,
  type AppBskyActorDefs,
  type AppBskyEmbedImages,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronLeftIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { blockAccount, muteAccount } from "../../../lib/account-actions";
import { useAgent } from "../../../lib/agent";
import { cx } from "../../../lib/utils/cx";
import { useLists } from "../../lists/context";
import { RichTextWithoutFacets } from "../../rich-text";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed;
  backButton?: boolean;
}

export const ProfileInfo = ({ profile, backButton }: Props) => {
  const agent = useAgent();
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

  const theme = useTheme();

  return (
    <View className="relative" pointerEvents="box-none">
      <Image
        source={{ uri: profile.banner }}
        className="h-32 w-full"
        alt=""
        pointerEvents="none"
      />
      {backButton && (
        <TouchableOpacity
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          className="absolute left-4 top-4 items-center justify-center rounded-full bg-black/60 p-2"
        >
          <ChevronLeftIcon size={24} color="white" />
        </TouchableOpacity>
      )}
      <View
        style={{ backgroundColor: theme.colors.card }}
        className="relative px-4 pb-1"
        pointerEvents="box-none"
      >
        <View
          className="h-10 flex-row items-center justify-end"
          pointerEvents="box-none"
        >
          <Link asChild href={`/images/${profile.did}`}>
            <TouchableOpacity
              className={cx(
                "absolute -top-11 left-0 rounded-full border-2",
                theme.dark ? "bg-black" : "bg-white",
              )}
              style={{ borderColor: theme.colors.card }}
            >
              <AnimatedImage
                sharedTransitionTag={profile.avatar}
                source={{ uri: profile.avatar }}
                className="h-20 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800"
                alt=""
                onLoad={({ source: { width, height } }) => {
                  queryClient.setQueryData(["image", profile.avatar, "size"], {
                    width,
                    height,
                  });
                }}
              />
            </TouchableOpacity>
          </Link>
          {agent.session?.handle !== profile.handle ? (
            <View className="flex-row justify-end" pointerEvents="box-none">
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
                    <CheckIcon
                      size={18}
                      className="mr-1 text-neutral-600 dark:text-neutral-300"
                    />
                    <Text className="font-medium text-neutral-600 dark:text-neutral-300">
                      Following
                    </Text>
                  </>
                ) : (
                  <>
                    <PlusIcon
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
                    "Share Profile",
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
                        case "Share Profile":
                          void Share.share({
                            message: `https://bsky.app/profile/${profile.handle}`,
                          });
                          break;
                        case "Mute Account":
                          muteAccount(
                            agent,
                            profile.handle,
                            profile.did,
                            queryClient,
                          );
                          break;
                        case "Block Account":
                          blockAccount(
                            agent,
                            profile.handle,
                            profile.did,
                            queryClient,
                          );

                          break;
                        case "Report Account":
                          // prettier-ignore
                          const reportOptions = [
                            { label: "Spam", value: ComAtprotoModerationDefs.REASONSPAM },
                            { label: "Misleading", value: ComAtprotoModerationDefs.REASONMISLEADING },
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
                <MoreHorizontalIcon
                  size={18}
                  className="text-neutral-600 dark:text-neutral-300"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
              onPress={() => {
                const options = ["Edit Profile", "Share Profile", "Cancel"];
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
                      case "Share Profile":
                        void Share.share({
                          message: `https://bsky.app/profile/${profile.handle}`,
                        });
                        break;
                    }
                  },
                );
              }}
            >
              <MoreHorizontalIcon
                size={18}
                className="text-neutral-600 dark:text-neutral-300"
              />
            </TouchableOpacity>
          )}
        </View>
        <View pointerEvents="none">
          <Text
            style={{ color: theme.colors.text }}
            className="mt-1 text-2xl font-medium"
          >
            {profile.displayName}
          </Text>
          <Text>
            {profile.viewer?.followedBy && (
              <>
                <Text className="bg-neutral-100 px-1 font-semibold dark:bg-neutral-900">
                  <Text style={{ color: theme.colors.text }}>
                    {" Follows you "}
                  </Text>
                </Text>{" "}
              </>
            )}
            <Text className="text-neutral-500 dark:text-neutral-400">
              @{profile.handle}
            </Text>
          </Text>
        </View>
        <View className="mt-3 flex-row" pointerEvents="box-none">
          <TouchableOpacity onPress={() => openFollowers(profile.did)}>
            <Text style={{ color: theme.colors.text }}>
              <Text className="font-bold">{profile.followersCount}</Text>{" "}
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openFollows(profile.did)}>
            <Text style={{ color: theme.colors.text }} className="ml-4">
              <Text className="font-bold">{profile.followsCount}</Text>{" "}
              Following
            </Text>
          </TouchableOpacity>
          <View pointerEvents="none">
            <Text style={{ color: theme.colors.text }} className="ml-4">
              <Text className="font-bold">{profile.postsCount ?? 0}</Text> Posts
            </Text>
          </View>
        </View>
        {profile.description && (
          <View className="mt-3" pointerEvents="box-none">
            <RichTextWithoutFacets
              text={profile.description.trim()}
              forcePointerEvents
            />
          </View>
        )}
        {profile.viewer?.muted && (
          <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
            <Text
              style={{ color: theme.colors.text }}
              className="font-semibold"
            >
              {profile.viewer.mutedByList
                ? `This user is on the "${profile.viewer.mutedByList.name}" mute list`
                : "You have muted this user"}
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
