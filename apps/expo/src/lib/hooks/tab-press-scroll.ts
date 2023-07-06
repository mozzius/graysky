/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useCallback, useEffect, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type Animated from "react-native-reanimated";
import {
  useAnimatedReaction,
  useScrollViewOffset,
} from "react-native-reanimated";
import { useNavigation } from "expo-router";
import { type FlashList } from "@shopify/flash-list";

export const useTabPressScroll = <T>(
  ref: React.RefObject<FlashList<T>>,
  callback: () => unknown = () => {},
) => {
  const navigation = useNavigation();
  const atTopRef = useRef(true);

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
            offset: 0,
            animated: true,
          });
        }
      }
    });

    return unsub;
  }, [callback, navigation, ref]);

  return useCallback((evt: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = evt.nativeEvent;

    if (contentOffset.y === 0) {
      atTopRef.current = true;
    } else if (atTopRef.current) {
      atTopRef.current = false;
    }

    // good place to hide header on scroll?
    // navigation.setOptions({
    //   headerShown: contentOffset.y <= 0 || velocity?.y < 0,
    // });
  }, []);
};

export const useTabPressScrollRef = <T>(callback: () => unknown = () => {}) => {
  const ref = useRef<FlashList<T>>(null);

  const onScroll = useTabPressScroll(ref, callback);

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
