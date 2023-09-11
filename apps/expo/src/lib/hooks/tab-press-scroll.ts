/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type Animated from "react-native-reanimated";
import {
  useAnimatedReaction,
  useScrollViewOffset,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { type FlashList } from "@shopify/flash-list";

interface Options {
  largeHeader?: boolean;
}

export const useTabPressScroll = <T>(
  ref: React.RefObject<FlashList<T>>,
  callback: () => unknown = () => {},
  { largeHeader }: Options = {},
) => {
  const navigation = useNavigation();
  const atTopRef = useRef(true);

  const { top } = useSafeAreaInsets();

  // 14 pro needs to be 5px more :/
  const targetOffset =
    largeHeader && Platform.OS === "ios"
      ? (top + 96 - StyleSheet.hairlineWidth) * -1
      : 0;

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.getParent()?.addListener("tabPress", (evt) => {
      if (navigation.isFocused()) {
        if (atTopRef.current) {
          callback();
        } else {
          // @ts-expect-error this is just wrong for some reason
          evt.preventDefault();
          ref.current?.scrollToOffset({
            offset: targetOffset,
            animated: true,
          });
        }
      }
    });

    return unsub;
  }, [callback, navigation, ref, targetOffset]);

  return useCallback(
    (evt: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = evt.nativeEvent;

      if (contentOffset.y === targetOffset) {
        atTopRef.current = true;
      } else if (atTopRef.current) {
        atTopRef.current = false;
      }

      // good place to hide header on scroll?
      // unfortunately is a bit jarring since it adjusts the height of the scroll view
      // navigation.setOptions({
      //   headerShown: contentOffset.y <= 0 || (velocity?.y ?? 0 )< 0,
      // });
    },
    [targetOffset],
  );
};

export const useTabPressScrollRef = <T>(
  callback: () => unknown = () => {},
  options: Options = {},
) => {
  const ref = useRef<FlashList<T>>(null);

  const onScroll = useTabPressScroll(ref, callback, options);

  return [ref, onScroll] as const;
};

export const useTabPress = (callback: () => unknown = () => {}) => {
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.getParent()?.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        callback();
      }
    });

    return unsub;
  }, [callback, navigation]);
};

export const useAnimatedTabPressScroll = (
  ref: React.RefObject<Animated.ScrollView>,
  callback: () => unknown = () => {},
) => {
  const navigation = useNavigation();
  const atTopRef = useRef(true);

  console.log("animated");

  useEffect(() => {
    const unsub = navigation
      .getParent()
      ?.getParent()
      // @ts-expect-error doesn't know what kind of navigator it is
      ?.addListener("tabPress", (evt) => {
        if (navigation.isFocused()) {
          console.log("atTop:", atTopRef.current);
          if (atTopRef.current) {
            callback();
          } else {
            // @ts-expect-error this is just wrong for some reason
            evt.preventDefault();
            ref.current?.scrollTo({
              y: 0,
              animated: true,
            });
          }
        }
      });

    return unsub;
  }, [callback, navigation, ref]);

  const offset = useScrollViewOffset(ref);

  useAnimatedReaction(
    () => {
      return offset.value;
    },
    (atTop) => {
      console.log(atTop);
      atTopRef.current = atTop <= 0;
    },
  );
};
