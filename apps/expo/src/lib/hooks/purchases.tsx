/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import Constants from "expo-constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const configureRevenueCat = async () => {
  await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  const apiKey = Platform.select({
    ios: Constants.expoConfig?.extra?.revenueCat?.ios,
    android: Constants.expoConfig?.extra?.revenueCat?.android,
  });
  Purchases.configure({
    apiKey,
    appUserID: null,
  });
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

const useCustomerInfoQuery = () => {
  return useQuery({
    queryKey: ["purchases", "info"],
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      console.log(JSON.stringify(info, null, 2));
      return info;
    },
    staleTime: Infinity,
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
