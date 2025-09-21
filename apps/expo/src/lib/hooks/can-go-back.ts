import { useEffect, useState } from "react";
import { useNavigation, usePathname } from "expo-router";

export const useCanGoBack = (name: string) => {
  const [canGoBack, setCanGoBack] = useState(false);
  const navigation = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    // we want to do navigation.getState().routes.length > 1
    // however this is the layout so we need to go find the child route
    setCanGoBack(
      (navigation.getState()?.routes.find((x) => x.name === name)?.state?.routes
        ?.length ?? 1) > 1,
    );
  }, [pathname, navigation, name]);

  return canGoBack;
};
