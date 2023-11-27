import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as QuickActions from "expo-quick-actions";

export function useQuickActionCallback(
  callback?: (data: QuickActions.Action) => void | Promise<void>,
) {
  useEffect(() => {
    let isMounted = true;

    if (QuickActions.initial) {
      void callback?.(QuickActions.initial);
    }

    const sub = QuickActions.addListener((event) => {
      if (isMounted) {
        void callback?.(event);
      }
    });
    return () => {
      isMounted = false;
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QuickActions.initial, callback]);
}

export function useQuickAction() {
  const [action, setAction] = useState<QuickActions.Action | null>(
    QuickActions.initial ?? null,
  );

  useEffect(() => {
    let isMounted = true;
    const sub = QuickActions.addListener((event) => {
      if (isMounted) {
        setAction(event);
      }
    });
    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  return action;
}

export function useSetupQuickActions() {
  // use static quick actions on iOS
  if (Platform.OS === "ios") return;

  // I highly doubt the OS is going to change between renders
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    void QuickActions.isSupported().then((supported) => {
      if (supported) {
        void QuickActions.setItems([
          {
            id: "search",
            title: "Search",
            params: { href: "/search" },
          },
          {
            id: "new-post",
            title: "New Post",
            params: { href: "/composer" },
          },
          {
            id: "settings",
            title: "Settings",
            params: { href: "/settings" },
          },
          {
            id: "about",
            title: "About",
            params: { href: "/settings/about" },
          },
        ]);
      }
    });
  }, []);
}
