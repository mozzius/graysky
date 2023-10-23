import { Fragment, useMemo } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper, type Facet } from "@atproto/api";

import { useLinkPress } from "~/lib/hooks/link-press";
import { cx } from "~/lib/utils/cx";
import { Text } from "./text";

interface Props {
  text: string;
  facets?: Facet[];
  size?: "sm" | "base" | "lg" | "xl";
  numberOfLines?: number;
  truncate?: boolean;
  disableLinks?: boolean;
  className?: string;
  selectable?: boolean;
}

export const RichText = ({
  text,
  facets,
  size = "base",
  numberOfLines,
  truncate = true,
  disableLinks,
  className,
  selectable,
}: Props) => {
  const router = useRouter();
  const onLongPressLink = useLinkPress();

  const classNames = cx(
    {
      "text-sm": size === "sm",
      "text-base leading-[22px]": size === "base",
      "text-lg leading-6": size === "lg",
      "text-xl leading-7": size === "xl",
    },
    className,
  );

  const segments = useMemo(() => {
    const rt = new RichTextHelper({ text, facets });
    const parts = [];
    for (const segment of rt.segments()) {
      if (segment.isLink()) {
        let textToShow = segment.text;
        if (truncate) {
          try {
            const url = new URL(segment.text);
            textToShow = url.hostname;
            if (url.pathname.length > 20 && truncate) {
              textToShow += url.pathname.slice(0, 17) + "...";
            } else {
              textToShow += url.pathname;
            }
            // trim trailing /
            if (textToShow.endsWith("/")) {
              textToShow = textToShow.slice(0, -1);
            }
          } catch (e) {
            textToShow = segment.text;
          }
        }
        parts.push({
          text: segment.text,
          component: (
            <Text
              className={cx("text-blue-500", classNames)}
              accessibilityRole="link"
              onPress={(evt) => {
                if (disableLinks) return;
                evt.stopPropagation();
                const url = segment.link!.uri;
                // TODO: better heuristic?
                if (url.startsWith("https://bsky.app")) {
                  const path = url.slice("https://bsky.app".length);
                  router.push(path);
                } else {
                  void Linking.openURL(url);
                  // check link is not deceptive
                  // TODO: the official app now shortens links - will need new logic
                  // const realHost = new URL(url).hostname;
                  // const statedHost = new URL(segment.text).hostname;
                  // if (realHost === statedHost) {
                  //   void Linking.openURL(url);
                  // } else {
                  //   Alert.alert(
                  //     "Deceptive link",
                  //     `This link does not match the stated URL in the text. This will take you to ${realHost}`,
                  //     [
                  //       {
                  //         text: "Cancel",
                  //         style: "cancel",
                  //       },
                  //       {
                  //         text: "Open anyway",
                  //         onPress: () => void Linking.openURL(url),
                  //       },
                  //     ],
                  //   );
                  // }
                }
              }}
              onLongPress={(evt) => {
                if (disableLinks) return;
                evt.stopPropagation();
                onLongPressLink(segment.link!.uri);
              }}
            >
              {textToShow}
            </Text>
          ),
        });
      } else if (segment.isMention()) {
        parts.push({
          text: segment.text,
          component: (
            <Text
              className={cx("text-blue-500", classNames)}
              accessibilityRole="link"
              onPress={(evt) => {
                evt.stopPropagation();
                router.push(`/profile/${segment.mention!.did}`);
              }}
            >
              {segment.text}
            </Text>
          ),
        });
      } else if (segment.isTag()) {
        let tag = segment.tag!.tag;
        if (!tag.startsWith("#")) {
          tag = `#${tag}`;
        }
        parts.push({
          text: segment.text,
          component: (
            <Text
              className={cx("text-blue-500", classNames)}
              accessibilityRole="link"
              onPress={(evt) => {
                evt.stopPropagation();
                router.push(`/search/posts?q=${encodeURIComponent(tag)}`);
              }}
            >
              {segment.text}
            </Text>
          ),
        });
      } else {
        parts.push({
          text: segment.text,
          component: <Text className={classNames}>{segment.text}</Text>,
        });
      }
    }
    // facets will lag behind text
    // for some reason the extra text will be blue in some cases, so add it manually
    const reconstructed = parts.map((p) => p.text).join("");
    if (text.length > reconstructed.length) {
      parts.push({
        text: text.slice(reconstructed.length),
        component: (
          <Text className={classNames}>{text.slice(reconstructed.length)}</Text>
        ),
      });
    }
    return parts;
  }, [
    text,
    facets,
    router,
    disableLinks,
    truncate,
    classNames,
    onLongPressLink,
  ]);

  if (!segments) return null;

  return (
    <Text
      className={classNames}
      numberOfLines={numberOfLines}
      selectable={selectable}
    >
      {segments.map(({ text, component }, i) => (
        <Fragment key={`${i}+${text}`}>{component}</Fragment>
      ))}
    </Text>
  );
};

export const RichTextWithoutFacets = ({
  text,
  ...props
}: Omit<Props, "facets">) => {
  const data = useMemo(() => {
    const rt = new RichTextHelper({ text });
    rt.detectFacetsWithoutResolution();
    return rt.facets;
  }, [text]);

  return <RichText text={text} facets={data} {...props} />;
};
