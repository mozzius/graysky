/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import Constants from "expo-constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "sentry-expo";

const configureRevenueCat = () => {
  if (process.env.NODE_ENV === "development")
    Purchases.setLogHandler(console.log);
  const apiKey = Platform.select({
    ios: Constants.expoConfig?.extra?.revenueCat?.ios,
    android: Constants.expoConfig?.extra?.revenueCat?.android,
  });
  if (!apiKey) throw new Error("No RevenueCat API key found");
  Purchases.configure({
    apiKey,
    appUserID: null,
  });
};

export const useConfigurePurchases = () => {
  useEffect(() => {
    try {
      configureRevenueCat();
    } catch (err) {
      Sentry.Native.captureException(err, {
        extra: Constants?.expoConfig?.extra,
      });
    }
  }, []);
};

const CustomerInfo = createContext<CustomerInfo | undefined | null>(null);

export const CustomerInfoProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const info = useCustomerInfoQuery();

  useEffect(() => {
    const listener = () => {
      void queryClient.refetchQueries(["purchases", "info"]);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => void Purchases.removeCustomerInfoUpdateListener(listener);
  }, [queryClient]);

  return (
    <CustomerInfo.Provider value={info.data}>{children}</CustomerInfo.Provider>
  );
};

class NotYetConfiguredError extends Error {
  constructor() {
    super("Not configured yet");
  }
}

const useCustomerInfoQuery = () => {
  return useQuery({
    queryKey: ["purchases", "info"],
    queryFn: async () => {
      if (!(await Purchases.isConfigured())) throw new NotYetConfiguredError();

      const info = await Purchases.getCustomerInfo();
      console.log(JSON.stringify(info, null, 2));
      return info;
    },
    staleTime: Infinity,
    retry: (_, err) => {
      if (err instanceof NotYetConfiguredError) return true;
      return 3;
    },
  });
};

export const useCustomerInfo = () => {
  const info = useContext(CustomerInfo);
  if (info === null)
    throw new Error(
      "useCustomerInfo must be used within a CustomerInfoProvider",
    );
  return info;
};

export const useIsPro = () => {
  const info = useCustomerInfo();

  return info?.entitlements.active.pro?.isActive ?? false;
};

export const useOfferings = () => {
  return useQuery({
    queryKey: ["offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
  });
};
