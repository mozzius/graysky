import { useEffect, useId, useState } from "react";
import {
  ActivityIndicator,
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
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react-native";
import * as DropdownMenu from "zeego/dropdown-menu";

import { TextButton } from "~/components/text-button";
import { Translation } from "~/components/translation";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAccountActions } from "~/lib/account-actions";
import { useAgent } from "~/lib/agent";
import { useHaptics, useProfileModeration } from "~/lib/hooks/preferences";
import { locale } from "~/lib/locale";
import { cx } from "~/lib/utils/cx";
import { useLists } from "../../lists/context";
import { RichTextWithoutFacets } from "../../rich-text";
import { Text } from "../../themed/text";
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
  const [translateBio, setTranslateBio] = useState(false);
  const { unblockAccount, unmuteAccount } = useAccountActions();

  const queryClient = useQueryClient();
  const theme = useTheme();
  const haptics = useHaptics();
  const id = useId();
  const path = useAbsolutePath();
  const { _ } = useLingui();

  const toggleFollow = useMutation({
    mutationKey: ["follow", profile.did],
    mutationFn: async () => {
      if (profile.viewer?.following) {
        await agent.deleteFollow(profile.viewer?.following);
        await queryClient.invalidateQueries({
          queryKey: ["profile", profile.did],
        });
        return "unfollowed";
      } else {
        await agent.follow(profile.did);
        await queryClient.invalidateQueries({
          queryKey: ["profile", profile.did],
        });
        return "followed";
      }
    },
    onMutate: () => haptics.impact(),
    onSuccess: (result) => {
      showToastable({
        title:
          result === "followed"
            ? _(msg`Followed user`)
            : _(msg`Unfollowed user`),
        message:
          result === "followed"
            ? _(msg`You are now following @${profile.handle}`)
            : _(msg`You are no longer following @${profile.handle}`),
      });
    },
    onError: () => {
      showToastable({
        message: _(msg`Could not follow user`),
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
        [-100, 0, 100],
        [
          -size * 1.75,
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
        [-120, -15, 0, 100],
        [100, 0, 0, 100],
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

  const moderation = useProfileModeration(profile);

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
            blurRadius={moderation.blur ? 90 : 0}
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
                  className="flex-1 bg-black/80"
                  style={[animatedOpacitysStyle]}
                />
              ),
            })}
            <Animated.View
              className={cx(
                "absolute",
                backButton ? "left-28" : "left-16",
                Platform.OS === "ios" ? "top-1/2 -translate-y-1/2" : "top-2",
              )}
              style={animatedOpacitysStyle}
              pointerEvents="none"
            >
              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                {profile.displayName || profile.handle}
              </Text>
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
            accessibilityLabel={_(msg`Back`)}
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
                cachePolicy="memory-disk"
                blurRadius={moderation.blur ? 90 : 0}
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
                      "mr-2 min-w-[120px] flex-row items-center justify-center rounded-full px-2 py-1.5",
                      profile.viewer?.following
                        ? "bg-neutral-200 dark:bg-neutral-700"
                        : "bg-black dark:bg-white",
                    )}
                  >
                    {profile.viewer?.following ? (
                      <>
                        {toggleFollow.isPending ? (
                          <View className="relative w-[18px] items-center justify-center">
                            <ActivityIndicator
                              size="small"
                              color={theme.dark ? "white" : "black"}
                              className="absolute"
                            />
                          </View>
                        ) : (
                          <CheckIcon
                            size={18}
                            className="text-neutral-600 dark:text-neutral-300"
                          />
                        )}
                        <Text className="ml-2 font-medium text-neutral-600 dark:text-neutral-300">
                          <Trans
                            id="following.action"
                            comment="'Following' - following a user"
                          >
                            Following
                          </Trans>
                        </Text>
                      </>
                    ) : (
                      <>
                        {toggleFollow.isPending ? (
                          <View className="relative w-[18px] items-center justify-center">
                            <ActivityIndicator
                              size="small"
                              color={theme.dark ? "black" : "white"}
                              className="absolute"
                            />
                          </View>
                        ) : (
                          <PlusIcon
                            size={18}
                            className="text-white dark:text-black"
                          />
                        )}
                        <Text className="ml-2 font-medium text-white dark:text-black">
                          <Trans>Follow</Trans>
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <OtherProfileOptions
                    profile={profile}
                    onTranslate={() => setTranslateBio(true)}
                  />
                </View>
              )
            ) : (
              <OwnProfileOptions profile={profile} />
            )}
          </View>
          <View pointerEvents="none" className="mt-1">
            <Text className="text-2xl font-medium">{profile.displayName}</Text>
            <View className="flex-row items-center">
              {profile.viewer?.followedBy && (
                <View className="mr-1 rounded bg-neutral-100 px-1.5 dark:bg-neutral-800">
                  <Text className="font-medium">
                    <Trans>Follows you</Trans>
                  </Text>
                </View>
              )}
              <Text className="text-neutral-500 dark:text-neutral-400">
                @{profile.handle}
              </Text>
            </View>
          </View>
          <View className="mt-1 flex-row flex-wrap" pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => openFollowers(profile.did)}
              className="mr-4 mt-1"
            >
              <Text>
                <Trans>
                  <Text className="font-bold">{profile.followersCount}</Text>{" "}
                  Followers
                </Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openFollows(profile.did)}
              className="mr-4 mt-1"
            >
              <Text>
                <Trans>
                  <Text className="font-bold">{profile.followsCount}</Text>{" "}
                  Following
                </Trans>
              </Text>
            </TouchableOpacity>
            <View pointerEvents="none" className="mt-1">
              <Text>
                <Trans>
                  <Text className="font-bold">{profile.postsCount ?? 0}</Text>{" "}
                  Posts
                </Trans>
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
          {translateBio && profile.description && (
            <View className="mt-1 flex-1">
              <Translation
                // cache on a day-by-day basis - absolute hack
                uri={`${profile.did}#${new Date().toISOString().split("T")[0]}`}
                text={profile.description}
                forceShow
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
                <Trans>
                  Joined{" "}
                  {new Intl.DateTimeFormat(locale.languageTag, {
                    month: "long",
                    year: "numeric",
                  }).format(profile.createdAt)}
                </Trans>
              </Text>
            </View>
          )}
          {profile.viewer?.muted && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">
                {profile.viewer.mutedByList ? (
                  <Trans>
                    This user is on the &quot;{profile.viewer.mutedByList.name}
                    &quot; mute list
                  </Trans>
                ) : (
                  <Trans>You have muted this user</Trans>
                )}
              </Text>
              <TextButton
                title={
                  profile.viewer.mutedByList ? _(msg`View`) : _(msg`Unmute`)
                }
                onPress={() => {
                  if (profile.viewer?.mutedByList) {
                    const segments = profile.viewer.mutedByList.uri.split("/");
                    router.push(
                      path(
                        `/profile/${segments.at(-3)}/lists/${segments.at(-1)}`,
                      ),
                    );
                  } else {
                    unmuteAccount(profile.did, profile.handle);
                  }
                }}
              />
            </View>
          )}
          {profile.viewer?.blocking && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">
                {profile.viewer.blockingByList ? (
                  <Trans>
                    This user is on the &quot;
                    {profile.viewer.blockingByList.name}&quot; block list
                  </Trans>
                ) : (
                  <Trans>You have blocked this user</Trans>
                )}
              </Text>
              <TextButton
                title={
                  profile.viewer.blockingByList ? _(msg`View`) : _(msg`Unblock`)
                }
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
                      profile.did,
                      profile.handle,
                      profile.viewer!.blocking!.split("/").pop()!,
                    );
                  }
                }}
              />
            </View>
          )}
          {profile.viewer?.blockedBy && (
            <View className="mt-3 flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
              <Text className="font-semibold">
                <Trans>This user has blocked you</Trans>
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const OwnProfileOptions = ({ profile }: Pick<Props, "profile">) => {
  const router = useRouter();
  const { _ } = useLingui();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700">
          <MoreHorizontalIcon
            size={18}
            className="text-neutral-600 dark:text-neutral-300"
          />
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          key="edit-profile"
          textValue={_(msg`Edit Profile`)}
          onSelect={() => router.push("/edit-bio")}
        >
          <DropdownMenu.ItemIcon ios={{ name: "person.circle" }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item
          key="share-profile"
          textValue={_(msg`Share profile`)}
          onSelect={() => {
            const url = `https://bsky.app/profile/${profile.handle}`;
            void Share.share(
              Platform.select({
                ios: { url },
                default: { message: url },
              }),
            );
          }}
        >
          <DropdownMenu.ItemIcon ios={{ name: "square.and.arrow.up" }} />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

interface OtherProfileOptionsProps {
  profile: AppBskyActorDefs.ProfileViewDetailed;
  onTranslate: () => void;
}

const OtherProfileOptions = ({
  profile,
  onTranslate,
}: OtherProfileOptionsProps) => {
  const { _ } = useLingui();
  const router = useRouter();
  const agent = useAgent();
  const { blockAccount, muteAccount } = useAccountActions();

  // prettier-ignore
  const reportOptions = [
    { label: _(msg`Frequently Posts Unwanted Content`), value: ComAtprotoModerationDefs.REASONSPAM },
    { label: _(msg`Misleading Account`), value: ComAtprotoModerationDefs.REASONMISLEADING },
    { label: _(msg`Name or Description Violates Community Standards`), value: ComAtprotoModerationDefs.REASONVIOLATION },
    { label: _(msg`Other`), value: ComAtprotoModerationDefs.REASONOTHER },
  ] as const;

  const report = async (reasonType: ComAtprotoModerationDefs.ReasonType) => {
    await agent.createModerationReport({
      reasonType,
      subject: {
        $type: "com.atproto.admin.defs#repoRef",
        did: profile.did,
      },
    });
    showToastable({
      title: _(msg`Report submitted`),
      message: _(msg`Thank you for making the skyline a safer place`),
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700">
          <MoreHorizontalIcon
            size={18}
            className="text-neutral-600 dark:text-neutral-300"
          />
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Item
            key="share-profile"
            textValue={_(msg`Share profile`)}
            onSelect={() => {
              const url = `https://bsky.app/profile/${profile.handle}`;
              void Share.share(
                Platform.select({
                  ios: { url },
                  default: { message: url },
                }),
              );
            }}
          >
            <DropdownMenu.ItemIcon ios={{ name: "square.and.arrow.up" }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="translate-bio"
            textValue={_(msg`Translate bio`)}
            onSelect={onTranslate}
          >
            <DropdownMenu.ItemIcon ios={{ name: "character.book.closed" }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="add-to-list"
            textValue={_(msg`Add to list`)}
            onSelect={() => router.push(`/add-to-list/${profile.did}`)}
          >
            <DropdownMenu.ItemIcon ios={{ name: "text.badge.plus" }} />
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Group>
          {!profile.viewer?.muted && (
            <DropdownMenu.Item
              key="mute"
              textValue={_(msg`Mute user`)}
              onSelect={() => muteAccount(profile.did, profile.handle)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "speaker.slash" }} />
            </DropdownMenu.Item>
          )}
          {!profile.viewer?.blocking && (
            <DropdownMenu.Item
              key="block"
              textValue={_(msg`Block user`)}
              onSelect={() => blockAccount(profile.did, profile.handle)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "xmark.octagon" }} />
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger
              key="report"
              textValue={_(msg`Report account`)}
            >
              <DropdownMenu.ItemIcon ios={{ name: "flag" }} />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Label>
                {_(msg`What's the issue with this account?`)}
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
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
