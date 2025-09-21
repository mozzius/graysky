import { cloneElement, useState } from "react";
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { isIOS26 } from "~/lib/utils/version";

interface Props {
  children: React.ReactElement<{
    onScroll: (evt: NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollEventThrottle: number;
  }>;
}

export const TransparentHeaderUntilScrolled = ({ children }: Props) => {
  const [atTop, setAtTop] = useState(true);
  const { dark } = useTheme();

  if (Platform.OS !== "ios") return children;

  if (isIOS26) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerShadowVisible: false,
            headerBlurEffect: undefined,
            headerStyle: {
              backgroundColor: "transparent",
            },
          }}
        />
        {children}
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={
          atTop
            ? {
                headerTransparent: true,
                headerShadowVisible: false,
                headerBlurEffect: undefined,
                headerStyle: {
                  backgroundColor: "transparent",
                },
              }
            : {
                headerShadowVisible: true,
                headerBlurEffect: dark
                  ? "systemThickMaterialDark"
                  : "systemChromeMaterialLight",
                headerStyle: {
                  backgroundColor: dark
                    ? "rgba(0,0,0,0.4)"
                    : "rgba(255,255,255,0.1)",
                },
              }
        }
      />
      {cloneElement(children, {
        onScroll: (evt: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { contentOffset } = evt.nativeEvent;
          setAtTop(contentOffset.y <= -50);
        },
        scrollEventThrottle: 32,
      })}
    </>
  );
};
