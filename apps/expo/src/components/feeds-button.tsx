import { useCallback, useMemo, useRef } from "react";
import { TouchableHighlight, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, usePathname, useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import {
  ChevronRightIcon,
  CircleDotIcon,
  CloudIcon,
  CloudyIcon,
} from "lucide-react-native";
import { ErrorBoundary } from "react-error-boundary";
import colors from "tailwindcss/colors";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useReorderFeeds, useSavedFeeds } from "~/lib/hooks/feeds";
import { useHaptics } from "~/lib/hooks/preferences";
import {
  useDefaultFeed,
  useHomepage,
  useListsAboveFeeds,
  useSortableFeeds,
} from "~/lib/storage/app-preferences";
import { cx } from "~/lib/utils/cx";
import { BackButtonOverride } from "./back-button-override";
import { ErrorBoundary as ErrorBoundaryDisplay } from "./error-boundary";
import { FeedRow } from "./feed-row";
import { ItemSeparator } from "./item-separator";
import { QueryWithoutData } from "./query-without-data";
import {
  LargeRow,
  NoFeeds,
  SectionHeader,
} from "./screens/feeds-screen-elements";
import { Text } from "./themed/text";

interface Props {
  show?: boolean;
}

export const FeedsButton = ({ show = true }: Props) => {
  const theme = useTheme();
  const haptics = useHaptics();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { top } = useSafeAreaInsets();
  const savedFeeds = useSavedFeeds();
  const router = useRouter();
  const homepage = useHomepage();
  const dimensions = useWindowDimensions();

  const dismiss = useCallback(() => bottomSheetRef.current?.dismiss(), []);

  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    // contentContainerStyle,
  } = useBottomSheetStyles();

  const reducedMotion = useReducedMotion();

  return (
    <>
      {show && (
        <Animated.View
          className="absolute bottom-6 right-6 flex-1 rounded-full"
          entering={FadeInDown}
          exiting={FadeOutDown}
        >
          <TouchableHighlight
            onPress={() => {
              haptics.selection();
              bottomSheetRef.current?.present();
            }}
            onLongPress={() => {
              haptics.selection();
              if (homepage === "feeds") {
                router.push("/feeds");
              } else {
                router.push("/feeds/manage");
              }
            }}
            accessibilityLabel="Open feed switch modal"
            className="flex-1 rounded-full"
          >
            <View
              className="flex-1 flex-row items-center rounded-full border py-2 pl-3.5 pr-2"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              }}
            >
              <CloudyIcon size={20} color={theme.colors.text} />
              <Text className="ml-3 mr-2 text-base">
                <Trans>My Feeds</Trans>
              </Text>
            </View>
          </TouchableHighlight>
        </Animated.View>
      )}
      <BottomSheetModal
        ref={bottomSheetRef}
        enablePanDownToClose
        snapPoints={["60%", dimensions.height - top - 10]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        backgroundStyle={backgroundStyle}
        enableDismissOnClose
        animateOnMount={!reducedMotion}
      >
        <BackButtonOverride dismiss={dismiss} />
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorBoundaryDisplay error={error} retry={resetErrorBoundary} />
          )}
        >
          <SheetContent feeds={savedFeeds} dismiss={dismiss} />
        </ErrorBoundary>
      </BottomSheetModal>
    </>
  );
};

const SheetContent = ({
  feeds,
  dismiss,
}: {
  feeds: ReturnType<typeof useSavedFeeds>;
  dismiss: () => void;
}) => {
  const theme = useTheme();
  const sortableFeeds = useSortableFeeds();
  const homepage = useHomepage();
  const defaultFeed = useDefaultFeed();
  const listsAboveFeeds = useListsAboveFeeds();
  const { _ } = useLingui();

  const { pinned, saved } = useReorderFeeds(feeds);

  const pathname = usePathname();
  const path = useAbsolutePath();

  const sections = useMemo(() => {
    if (!feeds.data) return [];
    const favs = pinned
      .map((uri) => {
        if (uri.includes("app.bsky.feed.generator")) {
          return feeds.data.feeds.find((f) => f.uri === uri)!;
        } else if (uri.includes("app.bsky.graph.list")) {
          return feeds.data.lists.find((f) => f.uri === uri)!;
        } else {
          return null as never;
        }
      })
      .filter(Boolean);

    const all = sortableFeeds
      ? saved
          .map((uri) => feeds.data.feeds.find((f) => f.uri === uri)!)
          .filter((x) => x && !x.pinned)
      : feeds.data.feeds
          .filter((feed) => !feed.pinned)
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

    const favourites = [
      {
        title: _(msg`Favourites`),
        data: favs,
      },
    ];
    const listsAndFeeds = [
      {
        title: _(msg`All feeds`),
        data: all,
      },
      {
        title: _(msg`My lists`),
        data: feeds.data.lists.filter((x) => x && !x.pinned),
      },
    ];

    if (listsAboveFeeds) {
      listsAndFeeds.reverse();
    }

    return favourites.concat(listsAndFeeds).filter((x) => x.data.length > 0);
  }, [feeds.data, listsAboveFeeds, pinned, saved, sortableFeeds, _]);

  if (feeds.data) {
    if (feeds.data.feeds.length === 0) {
      return <NoFeeds />;
    }

    return (
      <BottomSheetSectionList
        sections={sections}
        renderItem={({ item }) => {
          const itemPathname = path(
            `/profile/${item.creator.did}/feed/${item.uri.split("/").pop()}`,
          );

          let active = false;

          if (homepage === "skyline" && pathname === "/feeds") {
            active = defaultFeed === item.uri;
          } else {
            active = pathname === itemPathname;
          }

          return (
            <FeedRow
              feed={item}
              onPress={dismiss}
              right={
                active && (
                  <CircleDotIcon
                    size={20}
                    className={cx(
                      "mr-1",
                      theme.dark ? "text-neutral-200" : "text-neutral-400",
                    )}
                  />
                )
              }
            />
          );
        }}
        keyExtractor={(item) => item.uri}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        ListHeaderComponent={
          <LargeRow
            icon={<CloudIcon size={32} color="white" />}
            title={_(
              msg({
                id: "following.feed",
                message: "Following",
                comment: "'Following' - The name of the main feed",
              }),
            )}
            subtitle={_(msg`Posts from people you follow`)}
            style={{ backgroundColor: theme.colors.card }}
            onPress={dismiss}
            right={
              (pathname === "/feeds/following" ||
                (pathname === "/feeds" &&
                  homepage === "skyline" &&
                  defaultFeed === "following")) && (
                <CircleDotIcon
                  size={20}
                  className={cx(
                    "mr-1",
                    theme.dark ? "text-neutral-200" : "text-neutral-400",
                  )}
                />
              )
            }
          />
        }
        ItemSeparatorComponent={() => (
          <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
        )}
        ListFooterComponent={
          <View className="p-6 pb-12">
            <Link
              href={homepage === "feeds" ? "/feeds" : "/feeds/manage"}
              asChild
              onPress={dismiss}
            >
              <TouchableHighlight className="overflow-hidden rounded-lg">
                <View
                  className="flex-row items-center justify-between p-4"
                  style={{
                    backgroundColor: theme.dark
                      ? colors.neutral[800]
                      : theme.colors.background,
                  }}
                >
                  <View className="flex-row items-center">
                    <CloudyIcon size={24} color={theme.colors.text} />
                    <Text
                      className="ml-4 text-base"
                      style={{ color: theme.colors.text }}
                    >
                      <Trans>Manage my feeds</Trans>
                    </Text>
                  </View>
                  <ChevronRightIcon size={20} color={theme.colors.text} />
                </View>
              </TouchableHighlight>
            </Link>
          </View>
        }
      />
    );
  }

  return <QueryWithoutData query={feeds} />;
};
