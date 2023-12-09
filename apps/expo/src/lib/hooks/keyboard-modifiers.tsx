import { useCallback } from "react";
import { AvoidSoftInput } from "react-native-avoid-softinput";
import {
  AndroidSoftInputModes,
  KeyboardController,
} from "react-native-keyboard-controller";
import { useFocusEffect } from "expo-router";

export const useAvoidSoftView = (): void => {
  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setShouldMimicIOSBehavior(true);

      return () => {
        AvoidSoftInput.setShouldMimicIOSBehavior(false);
      };
    }, []),
  );
};

export const useControlledKeyboard = () => {
  useFocusEffect(
    useCallback(() => {
      KeyboardController.setInputMode(
        AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE,
      );

      return () => KeyboardController.setDefaultMode();
    }, []),
  );
};
