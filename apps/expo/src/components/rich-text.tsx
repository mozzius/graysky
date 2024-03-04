import { Fragment, memo, useMemo } from "react";
import { type StyleProp, type TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper, type Facet } from "@atproto/api";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useLinkPress } from "~/lib/hooks/link-press";
import { cx } from "~/lib/utils/cx";
import { SelectableText } from "./themed/text";

interface Props {
  text: string;
  facets?: Facet[];
  size?: "sm" | "base" | "lg" | "xl";
  numberOfLines?: number;
  truncate?: boolean;
  disableLinks?: boolean;
  className?: string;
  selectable?: boolean;
  uiTextView?: boolean;
  detectFacets?: boolean;
  style?: StyleProp<TextStyle>;
}

const RichTextInner = ({
  text,
  facets,
  size = "base",
  numberOfLines,
  truncate = true,
  disableLinks,
  className,
  selectable = true,
  uiTextView = true,
  detectFacets,
  style,
}: Props) => {
  const router = useRouter();
  const { openLink, showLinkOptions } = useLinkPress();
  const path = useAbsolutePath();

  const segments = useMemo(() => {
    const rt = new RichTextHelper({ text, facets });
    if (detectFacets) {
      rt.detectFacetsWithoutResolution();
    }
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
            <SelectableText
              className="text-blue-500"
              accessibilityRole="link"
              onPress={(evt) => {
                if (disableLinks) return;
                evt.stopPropagation();
                const url = segment.link!.uri;
                // TODO: better heuristic?
                if (url.startsWith("https://bsky.app")) {
                  const pathname = url.slice("https://bsky.app".length);
                  router.push(path(pathname));
                } else {
                  void openLink(url);
                  // TODO: check link is not deceptive
                  // the official app now shortens links - will need new logic
                }
              }}
              onLongPress={(evt) => {
                if (disableLinks) return;
                evt.stopPropagation();
                showLinkOptions(segment.link!.uri);
              }}
              selectable={selectable}
              uiTextView={uiTextView}
            >
              {textToShow}
            </SelectableText>
          ),
        });
      } else if (segment.isMention()) {
        parts.push({
          text: segment.text,
          component: (
            <SelectableText
              className="text-blue-500"
              accessibilityRole="link"
              onPress={(evt) => {
                evt.stopPropagation();
                router.push(path(`/profile/${segment.mention!.did}`));
              }}
              selectable={selectable}
              uiTextView={uiTextView}
            >
              {segment.text}
            </SelectableText>
          ),
        });
      } else if (segment.isTag()) {
        let tag = segment.tag!.tag;
        // workaround for bad implementations
        if (tag === segment.text && tag.startsWith("#")) {
          tag = tag.slice(1);
        }
        parts.push({
          text: segment.text,
          component: (
            <SelectableText
              className="text-blue-500"
              accessibilityRole="link"
              onPress={(evt) => {
                evt.stopPropagation();
                router.push(path(`/tag/${encodeURIComponent(tag)}`));
              }}
              selectable={selectable}
              uiTextView={uiTextView}
            >
              {segment.text}
            </SelectableText>
          ),
        });
      } else {
        parts.push({
          text: segment.text,
          component: (
            <SelectableText selectable={selectable} uiTextView={uiTextView}>
              {segment.text}
            </SelectableText>
          ),
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
          <SelectableText>{text.slice(reconstructed.length)}</SelectableText>
        ),
      });
    }
    return parts;
  }, [
    text,
    facets,
    truncate,
    disableLinks,
    router,
    openLink,
    showLinkOptions,
    path,
    detectFacets,
    selectable,
    uiTextView,
  ]);

  if (!segments) return null;

  return (
    <SelectableText
      className={cx(
        {
          "text-sm": size === "sm",
          "text-base leading-[22px]": size === "base",
          "text-lg leading-6": size === "lg",
          "text-xl leading-7": size === "xl",
        },
        className,
      )}
      style={style}
      numberOfLines={numberOfLines}
      selectable={selectable}
      uiTextView={uiTextView}
    >
      {segments.map(({ text, component }, i) => (
        <Fragment key={`${i}+${text}`}>{component}</Fragment>
      ))}
    </SelectableText>
  );
};

export const RichText = memo(RichTextInner);
