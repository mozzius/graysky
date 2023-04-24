import { Fragment, useMemo } from "react";
import { Linking, Text } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper, type Facet } from "@atproto/api";

import { cx } from "../lib/utils/cx";

interface Props {
  text: string;
  facets?: Facet[];
  size?: "sm" | "base" | "lg";
}

export const RichText = ({ text, facets, size = "base" }: Props) => {
  const router = useRouter();

  const segments = useMemo(() => {
    const rt = new RichTextHelper({ text, facets });
    const parts = [];
    for (const segment of rt.segments()) {
      if (segment.isLink()) {
        parts.push({
          text: segment.text,
          component: (
            <Text
              className="text-blue-500"
              onPress={(evt) => {
                evt.stopPropagation();
                const url = segment.link!.uri;
                // TODO: better heuristic?
                if (url.startsWith("https://bsky.app/profile")) {
                  const path = url.slice("https://bsky.app".length);
                  router.push(path);
                } else {
                  void Linking.openURL(url);
                }
              }}
            >
              {segment.text}
            </Text>
          ),
        });
      } else if (segment.isMention()) {
        parts.push({
          text: segment.text,
          component: (
            <Text
              className="text-blue-500"
              onPress={(evt) => {
                evt.stopPropagation();
                router.push(`/profile/${segment.mention!.did}`);
              }}
            >
              {segment.text}
            </Text>
          ),
        });
      } else {
        parts.push({
          text: segment.text,
          component: segment.text,
        });
      }
    }
    return parts;
  }, [text, facets]);

  if (!segments) return null;

  return (
    <Text
      className={cx({
        "text-sm": size === "sm",
        "text-base leading-[22px]": size === "base",
        "text-lg leading-6": size === "lg",
      })}
    >
      {segments.map(({ text, component }, i) => (
        <Fragment key={`${i}+${text}`}>{component}</Fragment>
      ))}
    </Text>
  );
};
