import { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesOfferings } from "react-native-purchases";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";

const OfferingsContext = createContext<PurchasesOfferings | null>(null);

export const OfferingsProvider = ({
  offerings,
  children,
}: {
  offerings: PurchasesOfferings;
  children: React.ReactNode;
}) => {
  return (
    <OfferingsContext.Provider value={offerings}>
      {children}
    </OfferingsContext.Provider>
  );
};

export const useOfferingsQuery = () => {
  return useQuery({
    queryKey: ["purchases", "offerings"],
    queryFn: async () => {
      console.log("fetching offerings");
      Purchases.configure({
        apiKey: Platform.select({
          ios: Constants.manifest?.extra?.revenueCat?.ios,
          android: Constants.manifest?.extra?.revenueCat?.android,
        }),
      });
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
};

export const useOfferings = () => {
  const offerings = useContext(OfferingsContext);
  if (!offerings) {
    throw new Error("OfferingsProvider not found");
  }
  return offerings;
};
