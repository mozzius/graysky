// yoinked from the official app

import { app } from "@bsky/sdk/lexicons";
import * as bcp47Match from "bcp-47-match";
import lande from "lande";

import { isType } from "~/lib/utils/types";
import { LANGUAGES_MAP_CODE2, LANGUAGES_MAP_CODE3 } from "./languages";

export function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data;
}

export function code2ToCode3(lang: string): string {
  if (lang.length === 2) {
    return LANGUAGES_MAP_CODE2[lang]?.code3 || lang;
  }
  return lang;
}

export function code3ToCode2(lang: string): string {
  if (lang.length === 3) {
    return LANGUAGES_MAP_CODE3[lang]?.code2 || lang;
  }
  return lang;
}

export function codeToLanguageName(lang: string): string {
  const lang2 = code3ToCode2(lang);
  return LANGUAGES_MAP_CODE2[lang2]?.name || lang;
}

export function getPostLanguage(
  post: app.bsky.feed.defs.PostView,
): string | undefined {
  let candidates: string[] = [];
  let postText = "";
  if (hasProp(post.record, "text") && typeof post.record.text === "string") {
    postText = post.record.text;
  }

  if (
    isType(app.bsky.feed.post, post.record) &&
    hasProp(post.record, "langs") &&
    Array.isArray(post.record.langs)
  ) {
    candidates = post.record.langs.filter(
      (lang): lang is string => typeof lang === "string",
    );
  }

  // if there's only one declared language, use that
  if (candidates?.length === 1) {
    return candidates[0];
  }

  // no text? can't determine
  if (postText.trim().length === 0) {
    return undefined;
  }

  // run the language model
  let langsProbabilityMap = lande(postText);

  // filter down using declared languages
  if (candidates?.length) {
    langsProbabilityMap = langsProbabilityMap.filter(
      ([lang, _probability]: [string, number]) => {
        return candidates.includes(code3ToCode2(lang));
      },
    );
  }

  if (langsProbabilityMap[0]) {
    return code3ToCode2(langsProbabilityMap[0][0]);
  }
}

export function isPostInLanguage(
  post: app.bsky.feed.defs.PostView,
  targetLangs: string[],
): boolean {
  const lang = getPostLanguage(post);
  if (!lang) {
    // the post has no text, so we just say "yes" for now
    return true;
  }
  return bcp47Match.basicFilter(lang, targetLangs).length > 0;
}
