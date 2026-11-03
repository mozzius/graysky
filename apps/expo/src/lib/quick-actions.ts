import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as QuickActions from "expo-quick-actions";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

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
