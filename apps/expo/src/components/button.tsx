import React from "react";
import {
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";
import { useRouter } from "expo-router";

import { cx } from "~/lib/utils/cx";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "white" | "black" | "outline";
  className?: string;
}

export const Button = ({
  onPress,
  className,
  variant = "black",
  children,
  style,
  ...props
}: ButtonProps) => {
  const isChildAString = typeof children === "string";
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cx(
        "items-center justify-center rounded-sm px-4 py-2.5",
        {
          black: "bg-neutral-950",
          white: "bg-white",
          outline: "border border-black dark:border-white",
        }[variant],
        className,
      )}
      style={[{ borderCurve: "continuous" }, style]}
      {...props}
    >
      {isChildAString ? (
        <Text
          className={cx(
            "text-base",
            {
              black: "text-white",
              white: "text-black",
              outline: "text-black dark:text-white",
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
  return (
    <Button
      onPress={() => router.push(href)}
      {...props}
      accessibilityRole="link"
    />
  );
};
