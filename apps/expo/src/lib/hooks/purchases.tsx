// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { createContext, useContext, useEffect } from "react";
// import { Platform } from "react-native";
// import Purchases, { type CustomerInfo } from "react-native-purchases";
// import Constants from "expo-constants";
// import { Slot } from "expo-router";
// import { useQuery, useQueryClient } from "@tanstack/react-query";

// export const configureRevenueCat = () => {
//   Purchases.configure({
//     apiKey: Platform.select({
//       ios: Constants.expoConfig?.extra?.revenueCat?.ios,
//       android: Constants.expoConfig?.extra?.revenueCat?.android,
//     }),
//   });
// };

// const CustomerInfo = createContext<CustomerInfo | null>(null);

// export const CustomerInfoProvider = ({
//   info,
//   children,
// }: {
//   info?: CustomerInfo;
//   children: React.ReactNode;
// }) => {
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     const listener = () => {
//       void queryClient.invalidateQueries(["purchases", "info"]);
//     };
//     Purchases.addCustomerInfoUpdateListener(listener);
//     return () => void Purchases.removeCustomerInfoUpdateListener(listener);
//   }, [queryClient]);

//   if (!info) return <Slot />;

//   return <CustomerInfo.Provider value={info}>{children}</CustomerInfo.Provider>;
// };

// export const useCustomerInfoQuery = () => {
//   return useQuery({
//     queryKey: ["purchases", "info"],
//     queryFn: async () => {
//       const info = await Purchases.getCustomerInfo();
//       return info;
//     },
//     staleTime: Infinity,
//   });
// };

// export const useCustomerInfo = () => {
//   const info = useContext(CustomerInfo);
//   if (!info)
//     throw new Error(
//       "useCustomerInfo must be used within a CustomerInfoProvider",
//     );
//   return info;
// };

// export const useIsPro = () => {
//   const info = useCustomerInfo();
//   if (!info)
//     throw new Error("useIsPro must be used within a CustomerInfoProvider");
//   return info.entitlements.active.pro?.isActive ?? false;
// };
