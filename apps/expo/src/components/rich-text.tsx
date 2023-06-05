import { Fragment, useMemo } from "react";
import { Linking, Text } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper, type Facet } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { useAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";

interface Props {
  text: string;
  facets?: Facet[];
  size?: "sm" | "base" | "lg" | "xl";
  numberOfLines?: number;
  truncate?: boolean;
  disableLinks?: boolean;
}

export const RichText = ({
  text,
  facets,
  size = "base",
  numberOfLines,
  truncate = true,
  disableLinks,
}: Props) => {
  const router = useRouter();

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
              className="text-blue-500"
              onPress={(evt) => {
                if (disableLinks) return;
                evt.stopPropagation();
                const url = segment.link!.uri;
                // TODO: better heuristic?
                if (url.startsWith("https://bsky.app/profile")) {
                  const path = url.slice("https://bsky.app".length);
                  router.push(path);
                } else {
                  void Linking.openURL(url);
                  // check link is not deceptive
                  // TODO: test
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
          component: <Text className="dark:text-white">{segment.text}</Text>,
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
          <Text className="dark:text-white">
            {text.slice(reconstructed.length)}
          </Text>
        ),
      });
    }
    return parts;
  }, [text, facets, router, disableLinks, truncate]);

  if (!segments) return null;

  return (
    <Text
      className={cx({
        "text-sm": size === "sm",
        "text-base leading-[22px]": size === "base",
        "text-lg leading-6": size === "lg",
        "text-xl leading-7": size === "xl",
      })}
      numberOfLines={numberOfLines}
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
  const agent = useAgent();
  const { data } = useQuery({
    queryKey: ["facets", text],
    queryFn: async () => {
      const rt = new RichTextHelper({ text });
      await rt.detectFacets(agent);
      return rt.facets ?? [];
    },
  });

  return <RichText text={text} facets={data} {...props} />;
};
