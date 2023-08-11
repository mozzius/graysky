import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@react-navigation/native";

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      void refetch();
    }, [refetch]),
  );
}

export function useUserRefresh<T>(refetch: () => Promise<T>) {
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    return refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // this doesn't work for some reason
  // const RefreshControlComponent = () => {
  //   return (
  //     <RefreshControl
  //       refreshing={refreshing}
  //       onRefresh={() => void handleRefresh()}
  //       tintColor={theme.colors.text}
  //     />
  //   );
  // };

  return {
    refreshing,
    handleRefresh,
    tintColor: theme.colors.text,
  };
}
