import React from "react";
import {
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { cx } from "../lib/utils/cx";

interface ButtonProps extends React.PropsWithChildren {
  onPress: (evt: GestureResponderEvent) => void | Promise<void>;
  variant?: "white" | "black" | "outline";
}

export const Button = ({
  onPress,
  variant = "black",
  children,
}: ButtonProps) => {
  const isChildAString = typeof children === "string";
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={(evt) => void onPress(evt)}
      className={cx(
        "items-center justify-center rounded-sm px-4 py-2",
        {
          black: "bg-black",
          white: "bg-white",
          outline: "border border-black dark:border-white",
        }[variant],
      )}
    >
      {isChildAString ? (
        <Text
          className={cx(
            "text-base",
            {
              black: "text-white",
              white: "text-black",
              outline: theme.colors.text,
            }[variant],
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

interface LinkProps extends Omit<ButtonProps, "onPress"> {
  href: string;
}

export const LinkButton = ({ href, ...props }: LinkProps) => {
  const router = useRouter();
  return <Button onPress={() => router.push(href)} {...props} />;
};
