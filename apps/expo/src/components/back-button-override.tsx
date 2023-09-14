import { useEffect } from "react";
import { BackHandler } from "react-native";

interface Props {
  dismiss: () => void;
}

export const BackButtonOverride = ({ dismiss }: Props) => {
  useEffect(() => {
    function onBackButton() {
      dismiss();
      return true;
    }
    BackHandler.addEventListener("hardwareBackPress", onBackButton);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackButton);
    };
  }, [dismiss]);

  return null;
};
