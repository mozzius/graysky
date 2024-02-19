import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as QuickActions from "expo-quick-actions";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";

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

    const actionSub = QuickActions.addListener((event) => {
      if (isMounted) {
        setAction(event);
      }
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (isMounted && state !== "active") {
        setAction(null);
      }
    });

    return () => {
      isMounted = false;
      actionSub.remove();
      appStateSub.remove();
    };
  }, []);

  return action;
}

export function useSetupQuickActions() {
  const { _ } = useLingui();

  useEffect(() => {
    // use static quick actions on iOS
    if (Platform.OS === "ios") return;
    void QuickActions.isSupported().then((supported) => {
      if (supported) {
        void QuickActions.setItems([
          {
            id: "search",
            title: _(msg`Search`),
            params: { href: "/search" },
            icon: "shortcut_search",
          },
          {
            id: "new-post",
            title: _(msg`New Post`),
            params: { href: "/composer" },
            icon: "shortcut_compose",
          },
          {
            id: "settings",
            title: _(msg`Settings`),
            params: { href: "/settings" },
            icon: "shortcut_settings",
          },
          {
            id: "about",
            title: _(msg`About`),
            params: { href: "/settings/about" },
            icon: "shortcut_about",
          },
        ]);
      }
    });
  }, [_]);
}
