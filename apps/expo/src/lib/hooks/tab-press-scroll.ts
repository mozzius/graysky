/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useNavigation } from "expo-router";
import { type FlashList } from "@shopify/flash-list";

export const useTabPressScroll = (
  ref: React.RefObject<FlashList<any>>,
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
  }, []);
};

export const useTabPressScrollRef = (callback: () => unknown = () => {}) => {
  const ref = useRef<FlashList<any>>(null);

  const onScroll = useTabPressScroll(ref, callback);

  return [ref, onScroll] as const;
};
