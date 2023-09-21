import { useCallback, useRef } from "react";
import { Dimensions, TouchableHighlight, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, usePathname, useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import {
  ChevronRightIcon,
  CircleDotIcon,
  CloudIcon,
  CloudyIcon,
} from "lucide-react-native";

import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useReorderFeeds, useSavedFeeds } from "~/lib/hooks/feeds";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { BackButtonOverride } from "./back-button-override";
import { FeedRow } from "./feed-row";
import { ItemSeparator } from "./item-separator";
import { QueryWithoutData } from "./query-without-data";
import {
  LargeRow,
  NoFeeds,
  SectionHeader,
} from "./screens/feeds-screen-elements";
import { Text } from "./text";

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
  const [{ homepage }] = useAppPreferences();

  const dismiss = useCallback(() => bottomSheetRef.current?.dismiss(), []);

  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    // contentContainerStyle,
  } = useBottomSheetStyles();

  return (
    <>
      {show && (
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
        >
          <Animated.View
            className="absolute bottom-6 right-6 flex-1 flex-row items-center rounded-full border p-3"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
            entering={FadeInDown}
            exiting={FadeOutDown}
          >
            <CloudyIcon size={24} color={theme.colors.text} />
            <Text className="ml-4 mr-2 text-base">My Feeds</Text>
          </Animated.View>
        </TouchableHighlight>
      )}
      <BottomSheetModal
        ref={bottomSheetRef}
        enablePanDownToClose
        snapPoints={["60%", Dimensions.get("window").height - top - 10]}
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
      >
        <BackButtonOverride dismiss={dismiss} />
        <SheetContent feeds={savedFeeds} dismiss={dismiss} />
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
  const [{ sortableFeeds, homepage, defaultFeed }] = useAppPreferences();

  const { pinned, saved } = useReorderFeeds(feeds);

  const pathname = usePathname();

  if (feeds.data) {
    if (feeds.data.feeds.length === 0) {
      return <NoFeeds />;
    }

    const favs = pinned
      .map((uri) => feeds.data.feeds.find((f) => f.uri === uri)!)
      .filter(Boolean);

    const all = sortableFeeds
      ? saved
          .map((uri) => feeds.data.feeds.find((f) => f.uri === uri)!)
          .filter((x) => x && !x.pinned)
      : feeds.data.feeds
          .filter((feed) => !feed.pinned)
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return (
      <BottomSheetSectionList
        sections={[
          {
            title: "Favourites",
            data: favs,
          },
          {
            title: "All feeds",
            data: all,
          },
        ]}
        renderItem={({ item }) => {
          const itemPathname = `/profile/${item.creator.did}/feed/${item.uri
            .split("/")
            .pop()}`;

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
                active ? (
                  <CircleDotIcon
                    size={20}
                    className={cx(
                      "mr-1",
                      theme.dark ? "text-neutral-200" : "text-neutral-400",
                    )}
                  />
                ) : (
                  <></>
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
            title="Following"
            subtitle="Posts from people you follow"
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
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <View className="flex-row items-center">
                    <CloudyIcon size={24} className="text-white" />
                    <Text className="ml-4 text-base text-white">
                      Manage my feeds
                    </Text>
                  </View>
                  <ChevronRightIcon size={20} className="text-neutral-50" />
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
