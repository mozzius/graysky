import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReactNativeToastable from "react-native-toastable";

export const Toastable = () => {
  const { top } = useSafeAreaInsets();

  return <ReactNativeToastable position="top" offset={top} />;
};
