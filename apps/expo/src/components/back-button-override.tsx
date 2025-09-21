import { useEffect } from "react";
import { BackHandler } from "react-native";

interface Props {
  dismiss?: () => void;
}

export const BackButtonOverride = ({ dismiss }: Props) => {
  useEffect(() => {
    function onBackButton() {
      if (dismiss) dismiss();
      return true;
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackButton);
    return () => {
      sub.remove();
    };
  }, [dismiss]);

  return null;
};
