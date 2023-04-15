import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { cx } from "../utils/cx";

interface ButtonProps extends React.PropsWithChildren {
  onPress: () => void;
  variant?: "white" | "black" | "outline";
  className?: string;
}

export const Button = ({
  onPress,
  variant = "black",
  className,
  children,
}: ButtonProps) => {
  const isChildAString = typeof children === "string";
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cx(
        "flex items-center justify-center rounded-sm px-4 py-2",
        {
          black: "bg-black",
          white: "bg-white",
          outline: "border border-black",
        }[variant],
        className,
      )}
    >
      {isChildAString ? (
        <Text
          className={cx(
            "text-base",
            {
              black: "text-white",
              white: "text-black",
              outline: "text-black",
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
