import { useEffect, useRef } from "react";
import { useNavigation } from "expo-router";
import { type FlashList } from "@shopify/flash-list";

export const useTabPressScroll = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: React.RefObject<FlashList<any>>,
  callback = () => {},
) => {
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.getParent()?.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        ref.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
        callback();
      }
    });

    return unsub;
  }, [callback, navigation, ref]);
};

export const useTabPressScrollRef = (callback = () => {}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);

  useTabPressScroll(ref, callback);

  return ref;
};
