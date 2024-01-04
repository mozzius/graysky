import { memo } from "react";
import { View, type StyleProp } from "react-native";
import { Image, type ImageProps, type ImageStyle } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react-native";
import { ErrorBoundary } from "react-error-boundary";

import { useOptionalAgent } from "~/lib/agent";
import { cx } from "~/lib/utils/cx";

interface Props {
  size?:
    | "extraLarge"
    | "large"
    | "medium"
    | "smallMedium"
    | "small"
    | "extraSmall";
  uri?: string;
  alt?: string;
  self?: boolean;
  cachePolicy?: ImageProps["cachePolicy"];
  blur?: boolean;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

const AvatarUnmemoized = ({ self, ...props }: Props) => {
  const theme = useTheme();

  return (
    <ErrorBoundary
      fallback={
        <View
          className={cx(
            "rounded-full",
            theme.dark ? "bg-neutral-800" : "bg-neutral-200",
            {
              "h-4 w-4": props.size === "extraSmall",
              "h-7 w-7": props.size === "small",
              "h-8 w-8": props.size === "smallMedium",
              "h-10 w-10": props.size === "medium",
              "h-12 w-12": props.size === "large",
              "h-14 w-14": props.size === "extraLarge",
            },
            props.className,
          )}
          style={props.style}
        />
      }
    >
      {self ? <SelfAvatar {...props} /> : <AvatarInner {...props} />}
    </ErrorBoundary>
  );
};

export const Avatar = memo(AvatarUnmemoized);

const SelfAvatar = ({ size = "large", alt, className, style }: Props) => {
  const agent = useOptionalAgent();

  const profile = useQuery({
    queryKey: ["profile", agent?.session?.did],
    queryFn: async () => {
      if (!agent?.session) return null;
      const profile = await agent.getProfile({
        actor: agent.session.did,
      });
      return profile.data;
    },
  });

  const uri = profile.data?.avatar;

  return (
    <AvatarInner
      size={size}
      uri={uri}
      alt={alt ?? profile.data?.displayName}
      className={className}
      style={style}
    />
  );
};

const AvatarInner = ({
  size,
  uri,
  alt,
  cachePolicy,
  blur,
  className: classNameProp,
  style,
}: Props) => {
  const theme = useTheme();

  const className = cx(
    "rounded-full object-cover items-center justify-center",
    theme.dark ? "bg-neutral-800" : "bg-neutral-200",
    {
      "h-4 w-4": size === "extraSmall",
      "h-7 w-7": size === "small",
      "h-8 w-8": size === "smallMedium",
      "h-10 w-10": size === "medium",
      "h-12 w-12": size === "large",
      "h-14 w-14": size === "extraLarge",
    },
    classNameProp,
  );

  if (uri) {
    return (
      <Image
        recyclingKey={uri}
        source={{ uri }}
        alt={alt}
        className={className}
        cachePolicy={cachePolicy ?? "memory-disk"}
        blurRadius={blur ? 90 : 0}
        style={style}
      />
    );
  }

  let iconSize;

  switch (size) {
    case "extraSmall":
      iconSize = 14;
      break;
    case "small":
      iconSize = 24;
      break;
    case "smallMedium":
      iconSize = 28;
      break;
    case "medium":
      iconSize = 34;
      break;
    case "large":
      iconSize = 42;
      break;
    case "extraLarge":
      iconSize = 50;
      break;
  }

  return (
    <View className={className} accessibilityLabel={alt} style={style}>
      <UserCircle
        size={iconSize}
        color={theme.colors.text}
        className="opacity-50"
      />
    </View>
  );
};
