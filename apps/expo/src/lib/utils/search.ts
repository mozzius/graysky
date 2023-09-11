// taken from the offical app

import { type AppBskyFeedPost } from "@atproto/api";

const PROFILES_ENDPOINT = "https://search.bsky.social/search/profiles";
const POSTS_ENDPOINT = "https://search.bsky.social/search/posts";

export interface ProfileSearchItem {
  $type: string;
  avatar: {
    cid: string;
    mimeType: string;
  };
  banner: {
    cid: string;
    mimeType: string;
  };
  description: string | undefined;
  displayName: string | undefined;
  did: string;
}

export interface PostSearchItem {
  tid: string;
  cid: string;
  user: {
    did: string;
    handle: string;
  };
  post: AppBskyFeedPost.Record;
}

export async function searchProfiles(
  query: string,
  signal?: AbortSignal,
): Promise<ProfileSearchItem[]> {
  return await doFetch<ProfileSearchItem[]>(PROFILES_ENDPOINT, query, signal);
}

export async function searchPosts(
  query: string,
  signal?: AbortSignal,
): Promise<PostSearchItem[]> {
  return await doFetch<PostSearchItem[]>(POSTS_ENDPOINT, query, signal);
}

async function doFetch<T>(
  endpoint: string,
  query: string,
  signal?: AbortSignal,
): Promise<T> {
  const uri = new URL(endpoint);
  uri.searchParams.set("q", query);

  const res = await fetch(String(uri), {
    method: "get",
    headers: {
      accept: "application/json",
    },
    signal,
  });

  const resHeaders: Record<string, string> = {};
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value;
  });
  const resBody = (await res.json()) as unknown as T;

  return resBody ?? ([] as T);
}
