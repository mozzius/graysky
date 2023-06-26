import { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import Constants from "expo-constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const configureRevenueCat = () => {
  Purchases.configure({
    apiKey: Platform.select({
      ios: Constants.expoConfig?.extra?.revenueCat?.ios,
      android: Constants.expoConfig?.extra?.revenueCat?.android,
    }),
  });
};

const CustomerInfo = createContext<CustomerInfo | null>(null);

export const CustomerInfoProvider = ({
  info,
  children,
}: {
  info?: CustomerInfo;
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = () => {
      queryClient.invalidateQueries(["purchases", "info"]);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => void Purchases.removeCustomerInfoUpdateListener(listener);
  }, []);

  return (
    <CustomerInfo.Provider value={info ?? null}>
      {children}
    </CustomerInfo.Provider>
  );
};

export const useCustomerInfoQuery = () => {
  return useQuery({
    queryKey: ["purchases", "info"],
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: Infinity,
  });
};

export const useCustomerInfo = () => {
  const offerings = useContext(CustomerInfo);
  return offerings;
};

export const useIsPro = () => {
  const info = useCustomerInfo();
  if (!info) return false; // still loading
  return info.entitlements.active.pro?.isActive ?? false;
};
