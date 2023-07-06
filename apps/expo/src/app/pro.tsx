import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

// import { useCustomerInfo } from "../lib/hooks/purchases";

export default function Pro() {
  // const info = useCustomerInfo();
  return (
    <>
      <StatusBar style="light" />
      <View className="p-4">
        {/* <Text>{JSON.stringify(info, null, 2)}</Text> */}
      </View>
    </>
  );
}
