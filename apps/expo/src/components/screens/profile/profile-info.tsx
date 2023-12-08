import { useEffect, useId } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import { useHeaderMeasurements } from "react-native-collapsible-tab-view";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import { BlurView } from "expo-blur";
import { Image, ImageBackground } from "expo-image";
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
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react-native";

import {
  blockAccount,
  muteAccount,
  unblockAccount,
  unmuteAccount,
} from "~/lib/account-actions";
import { useAgent } from "~/lib/agent";
import { useHaptics } from "~/lib/hooks/preferences";
import { useAbsolutePath } from "~/lib/hooks/use-absolute-path";
import { locale } from "~/lib/locale";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { cx } from "~/lib/utils/cx";
import { produce } from "~/lib/utils/produce";
import { useLists } from "../../lists/context";
import { RichTextWithoutFacets } from "../../rich-text";
import { Text } from "../../text";
import { useDefaultHeaderHeight } from "./hooks";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const INITIAL_HEADER_HEIGHT = 90;
const AVATAR_PLATFORM_ADJUST = Platform.select({
  android: 60,
  default: 0,
});

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed & { createdAt?: Date };
  backButton?: boolean;
}

export const ProfileInfo = ({ profile, backButton }: Props) => {
  const agent = useAgent();
  const router = useRouter();
  const { openFollows, openFollowers } = useLists();
  const { showActionSheetWithOptions } = useActionSheet();

  const queryClient = useQueryClient();
  const theme = useTheme();
  const haptics = useHaptics();
  const id = useId();
  const path = useAbsolutePath();

  const toggleFollow = useMutation({
    mutationKey: ["follow", profile.did],
    mutationFn: async () => {
      const updater = (old: AppBskyActorDefs.ProfileView | undefined) => {
        if (!old) return;
        return produce(old, (draft) => {
          if (draft.viewer) {
            if (draft.viewer.following) {
              delete draft.viewer.following;
            } else {
              draft.viewer.following = "pending";
            }
          }
        });
      };
      queryClient.setQueryData(["profile", profile.handle], updater);
      queryClient.setQueryData(["profile", profile.did], updater);
      if (profile.viewer?.following) {
        await agent.deleteFollow(profile.viewer?.following);
        return "unfollowed";
      } else {
        await agent.follow(profile.did);
        return "followed";
      }
    },
    onMutate: () => haptics.impact(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["network"] });
    },
    onSuccess: (result) => {
      showToastable({
        title: result === "followed" ? "Followed user" : "Unfollowed user",
        message: `You are ${
          result === "followed" ? "now following" : "no longer following"
        } @${profile.handle}`,
      });
    },
    onError: () => {
      showToastable({
        message: "Could not follow user",
        status: "danger",
      });
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
            aspectRatio: { width: 1, height: 1 },
          } satisfies AppBskyEmbedImages.ViewImage,
        ],
      );
    }
  }, [profile, queryClient]);

  const handleOptions = () => {
    const options = [
      "Share profile",
      profile.viewer?.muted ? "Unmute account" : "Mute account",
      profile.viewer?.blocking ? "Unblock account" : "Block account",
      "Report account",
    ] as const;
    showActionSheetWithOptions(
      {
        options: [...options, "Cancel"],
        cancelButtonIndex: options.length,
        ...actionSheetStyles(theme),
      },
      (index) => {
        if (index === undefined) return;
        const option = options[index];
        switch (option) {
          case "Share profile": {
            const url = `https://bsky.app/profile/${profile.handle}`;
            void Share.share(
              Platform.select({
                ios: { url },
                default: { message: url },
              }),
            );
            break;
          }
          case "Mute account":
            muteAccount(agent, profile.handle, profile.did, queryClient);
            break;
          case "Unmute account":
            unmuteAccount(agent, profile.handle, profile.did, queryClient);
            break;
          case "Block account":
            blockAccount(agent, profile.handle, profile.did, queryClient);
            break;
          case "Unblock account":
            unblockAccount(
              agent,
              profile.handle,
              profile.viewer!.blocking!.split("/").pop()!,
              queryClient,
            );
            break;
          case "Report account": {
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
                ...actionSheetStyles(theme),
              },
              async (index) => {
                if (index === undefined) return;
                const reason = reportOptions[index]!.value;
                if (reason === "Cancel") return;
                await agent.createModerationReport({
                  reasonType: reason,
                  subject: {
                    $type: "com.atproto.admin.defs#repoRef",
                    did: profile.did,
                  },
                });
                showToastable({
                  title: "Report submitted",
                  message: "Thank you for making the skyline a safer place",
                });
              },
            );
            break;
          }
        }
      },
    );
  };

  const { top } = useSafeAreaInsets();
  const headerHeight = useDefaultHeaderHeight();
  const headerMeasurements = useHeaderMeasurements();

  const statusBarHeight = top > 50 ? top - 5 : top;

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -headerMeasurements.top.value }],
    };
  });

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        -headerMeasurements.top.value,
        [-100, 0, 100],
        [
          (INITIAL_HEADER_HEIGHT + statusBarHeight) * 1.75,
          INITIAL_HEADER_HEIGHT + statusBarHeight,
          headerHeight,
        ],
        {
          extrapolateLeft: Extrapolation.EXTEND,
          extrapolateRight: Extrapolation.CLAMP,
        },
      ),
    };
  });

  const animatedOpacitysStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        -headerMeasurements.top.value,
        [0, 100],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    const size = interpolate(
      -headerMeasurements.top.value,
      [0, 100],
      [80, 32],
      Extrapolation.CLAMP,
    );
    return {
      width: size,
      height: size,
      bottom: interpolate(
        -headerMeasurements.top.value,
        [0, 100],
        [
          -size / 2,
          (headerHeight +
            statusBarHeight +
            (top > 50 ? -5 : 10) +
            AVATAR_PLATFORM_ADJUST) /
            2 -
            size / 2,
        ],
        {
          extrapolateLeft: Extrapolation.EXTEND,
          extrapolateRight: Extrapolation.CLAMP,
        },
      ),
      transform: [
        {
          translateX: backButton
            ? interpolate(
                -headerMeasurements.top.value,
                [0, 100],
                [0, 45],
                Extrapolation.CLAMP,
              )
            : 0,
        },
      ],
    };
  });

  const animatedBlurProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(
        -headerMeasurements.top.value,
        [-50, 0, 100],
        [100, 0, 100],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedActivityIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        headerMeasurements.top.value,
        [25, 60],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View className="relative" pointerEvents="box-none">
      <Animated.View
        style={[
          animatedContainerStyle,
          { height: INITIAL_HEADER_HEIGHT + statusBarHeight },
        ]}
        className="absolute top-0 z-10 w-full"
        pointerEvents="box-none"
      >
        {/* banner image */}
        <Animated.View style={animatedHeaderStyle} className="z-20 w-full">
          <ImageBackground
            source={profile.banner}
            alt=""
            className="flex-1"
            pointerEvents="none"
          >
            {Platform.select({
              ios: (
                <AnimatedBlurView
                  animatedProps={animatedBlurProps}
                  className="flex-1"
                  tint="dark"
                />
              ),
              android: (
                <Animated.View
                  className="flex-1"
                  style={[
                    animatedOpacitysStyle,
                    { backgroundColor: theme.colors.card },
                  ]}
                />
              ),
            })}
            <Animated.View
              className={cx(
                "absolute",
                backButton ? "left-28" : "left-16",
                Platform.OS === "ios" ? "top-1/2 -translate-y-1/2" : "top-1.5",
              )}
              style={animatedOpacitysStyle}
              pointerEvents="none"
            >
              {profile.displayName && (
                <Text
                  className="text-sm font-bold text-white"
                  numberOfLines={1}
                >
                  {profile.displayName}
                </Text>
              )}
              <Text className="text-xs text-white" numberOfLines={1}>
                @{profile.handle}
              </Text>
            </Animated.View>
          </ImageBackground>
          {Platform.OS === "ios" && (
            <Animated.View
              className="absolute left-0 top-0 h-full w-full flex-1 items-center justify-center"
              style={animatedActivityIndicatorStyle}
              pointerEvents="none"
            >
              <ActivityIndicator color="white" size="small" />
            </Animated.View>
          )}
        </Animated.View>
        {/* back button */}
        {backButton && (
          <TouchableOpacity
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => router.back()}
            className={cx(
              "absolute left-4 z-30 items-center justify-center rounded-full p-1.5",
              Platform.OS === "android"
                ? "mt-2.5 bg-neutral-800"
                : "bg-black/60",
            )}
            style={{ top: statusBarHeight }}
          >
            <ChevronLeftIcon size={20} color="white" />
          </TouchableOpacity>
        )}
        {/* profile picture */}
        <Animated.View
          style={animatedImageStyle}
          className="absolute left-4 z-40 origin-left rounded-full"
        >
          <Link asChild href={`/images/${profile.did}?tag=${id}`}>
            <TouchableOpacity
              className={cx(
                "h-full w-full rounded-full border-2",
                theme.dark ? "bg-black" : "bg-white",
              )}
              style={{ borderColor: theme.colors.card }}
            >
              <AnimatedImage
                // sharedTransitionTag={id}
                source={{ uri: profile.avatar }}
                className="h-full w-full rounded-full bg-neutral-200 dark:bg-neutral-800"
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
        </Animated.View>
        {}
      </Animated.View>
      <View
        pointerEvents="box-none"
        className="bg-transparent"
        style={{
          paddingTop: statusBarHeight + INITIAL_HEADER_HEIGHT,
          backgroundColor: theme.colors.card,
        }}
      >
        <View className="px-4 pt-1" pointerEvents="box-none">
          <View
            className="h-10 flex-row items-center justify-end"
            pointerEvents="box-none"
          >
            {agent.session?.handle !== profile.handle ? (
              !profile.viewer?.blocking && (
                <View className="flex-row justify-end" pointerEvents="box-none">
                  <TouchableOpacity
                    disabled={toggleFollow.isPending}
                    onPress={() => toggleFollow.mutate()}
                    className={cx(
                      "min-w-[120px] flex-row items-center justify-center rounded-full px-2 py-1.5",
                      profile.viewer?.following
                        ? "bg-neutral-200 dark:bg-neutral-700"
                        : "bg-black dark:bg-white",
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
                    onPress={handleOptions}
                  >
                    <MoreHorizontalIcon
                      size={18}
                      className="text-neutral-600 dark:text-neutral-300"
                    />
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <TouchableOpacity
                className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                onPress={() => {
                  const options = ["Edit Profile", "Share Profile", "Cancel"];
                  showActionSheetWithOptions(
                    {
                      options,
                      cancelButtonIndex: options.length - 1,
                      ...actionSheetStyles(theme),
                    },
                    (index) => {
                      if (index === undefined) return;
                      const option = options[index];
                      switch (option) {
                        case "Edit Profile":
                          router.push("/settings/account/edit-bio");
                          break;
                        case "Share Profile": {
                          const url = `https://bsky.app/profile/${profile.handle}`;
                          void Share.share(
                            Platform.select({
                              ios: { url },
                              default: { message: url },
                            }),
                          );
                          break;
                        }
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
          <View pointerEvents="none" className="mt-1">
            <Text className="text-2xl font-medium">{profile.displayName}</Text>
            <Text>
              {profile.viewer?.followedBy && (
                <>
                  <Text className="bg-neutral-100 px-1 font-semibold dark:bg-neutral-900">
                    <Text>{" Follows you "}</Text>
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
              <Text>
                <Text className="font-bold">{profile.followersCount}</Text>{" "}
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openFollows(profile.did)}>
              <Text className="ml-4">
                <Text className="font-bold">{profile.followsCount}</Text>{" "}
                Following
              </Text>
            </TouchableOpacity>
            <View pointerEvents="none">
              <Text className="ml-4">
                <Text className="font-bold">{profile.postsCount ?? 0}</Text>{" "}
                Posts
              </Text>
            </View>
          </View>
          {profile.description &&
            !(
              profile.viewer?.blocking ||
              profile.viewer?.blockedBy ||
              profile.viewer?.muted
            ) && (
              <View className="mt-3" pointerEvents="box-none">
                <RichTextWithoutFacets
                  text={profile.description.trim()}
                  size="sm"
                />
              </View>
            )}
          {profile.createdAt && (
            <View
              className="mt-3 flex-1 flex-row items-center"
              pointerEvents="none"
            >
              <CalendarIcon
                size={14}
                className="mr-1.5 text-neutral-500 dark:text-neutral-400"
              />
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Joined{" "}
                {new Intl.DateTimeFormat(locale.languageTag, {
                  month: "long",
                  year: "numeric",
                }).format(profile.createdAt)}
              </Text>
            </View>
          )}
          {profile.viewer?.muted && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">
                {profile.viewer.mutedByList
                  ? `This user is on the "${profile.viewer.mutedByList.name}" mute list`
                  : "You have muted this user"}
              </Text>
              <Button
                title={profile.viewer.mutedByList ? "View" : "Unmute"}
                onPress={() => {
                  if (profile.viewer?.mutedByList) {
                    const segments = profile.viewer.mutedByList.uri.split("/");
                    router.push(
                      path(
                        `/profile/${segments.at(-3)}/lists/${segments.at(-1)}`,
                      ),
                    );
                  } else {
                    unmuteAccount(
                      agent,
                      profile.handle,
                      profile.did,
                      queryClient,
                    );
                  }
                }}
              />
            </View>
          )}
          {profile.viewer?.blocking && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">
                {profile.viewer.blockingByList
                  ? `This user is on the "${profile.viewer.blockingByList.name}" block list`
                  : "You have blocked this user"}
              </Text>
              <Button
                title={profile.viewer.blockingByList ? "View" : "Unblock"}
                onPress={() => {
                  if (profile.viewer?.blockingByList) {
                    const segments =
                      profile.viewer.blockingByList.uri.split("/");
                    router.push(
                      path(
                        `/profile/${segments.at(-3)}/lists/${segments.at(-1)}`,
                      ),
                    );
                  } else {
                    unblockAccount(
                      agent,
                      profile.handle,
                      profile.viewer!.blocking!.split("/").pop()!,
                      queryClient,
                    );
                  }
                }}
              />
            </View>
          )}
          {profile.viewer?.blockedBy && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">This user has blocked you</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
