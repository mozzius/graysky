import { Platform, Pressable } from "react-native";
import { HoldItem } from "react-native-hold-menu";
import { type HoldItemProps } from "react-native-hold-menu/lib/typescript/components/holdItem";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";

export const HoldMenu = ({
  children,
  items,
  activateOn,
  actionParams,
  containerStyles,
  ...props
}: HoldItemProps) => {
  const theme = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();

  if (Platform.OS === "ios") {
    return (
      <HoldItem
        items={items}
        activateOn={activateOn}
        actionParams={actionParams}
        theme={theme.dark ? "dark" : "light"}
        containerStyles={containerStyles}
        {...props}
      >
        {children}
      </HoldItem>
    );
  } else {
    return null;
    // const onActive = () => {
    //   console.log("onActive");
    //   const options = [...items.map((item) => item.text), "Cancel"];
    //   showActionSheetWithOptions(
    //     {
    //       options,
    //       cancelButtonIndex: options.length - 1,
    //       userInterfaceStyle: theme.dark ? "dark" : "light",
    //     },
    //     (index) => {
    //       if (!index) return;
    //       if (index < items.length) {
    //         const item = items[index];
    //         if (!item?.onPress) return;
    //         if (actionParams) {
    //           item.onPress(actionParams[item.text]);
    //         } else {
    //           item.onPress();
    //         }
    //       }
    //     },
    //   );
    // };
    // return (
    //   <Pressable
    //     onPress={activateOn === "tap" ? onActive : undefined}
    //     onLongPress={() => onActive()}
    //     // onLongPress={activateOn !== "tap" ? onActive : undefined}
    //     style={containerStyles}
    //   >
    //     {children}
    //   </Pressable>
    // );
  }
};
