/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  type FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { FlashListRef } from "@shopify/flash-list";

interface Options {
  largeHeader?: boolean;
  setScrollDir?: (dir: number) => void;
}

export const useTabPressScroll = <T>(
  ref: React.RefObject<FlashListRef<T> | FlatList<T> | null>,
  callback: () => unknown = () => {},
  { largeHeader, setScrollDir }: Options = {},
) => {
  const navigation = useNavigation();
  const atTopRef = useRef(true);

  const prev = useRef(0);

  const { top } = useSafeAreaInsets();

  // 14 pro needs to be 5px smaller
  // see https://github.com/software-mansion/react-native-screens/blob/24689052c009f383657a74521c5ce875044ee2ef/src/native-stack/views/NativeStackView.tsx#L431
  const statusBarHeight = top > 50 ? top - 5 : top;

  const targetOffset =
    largeHeader && Platform.OS === "ios" ? (statusBarHeight + 96) * -1 : 0;

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

      if (setScrollDir) {
        if (contentOffset.y <= 0) {
          setScrollDir(0);
        } else if (contentOffset.y > prev.current) {
          setScrollDir(1);
        } else if (contentOffset.y < prev.current) {
          setScrollDir(-1);
        }
      }

      prev.current = contentOffset.y;

      // good place to hide header on scroll?
      // unfortunately is a bit jarring since it adjusts the height of the scroll view
      // navigation.setOptions({
      //   headerShown: contentOffset.y <= 0 || (velocity?.y ?? 0 )< 0,
      // });
    },
    [targetOffset, setScrollDir],
  );
};

export const useTabPressScrollRef = <T>(
  callback: () => unknown = () => {},
  options: Options = {},
) => {
  const ref = useRef<FlashListRef<T>>(null);

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
