import { FullWindowOverlay } from "react-native-screens";
import ReactNativeToastable from "react-native-toastable";

export const Toastable = () => (
  <FullWindowOverlay>
    <ReactNativeToastable />
  </FullWindowOverlay>
);
