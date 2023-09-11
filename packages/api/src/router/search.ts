import { type AppBskyFeedDefs } from "@atproto/api";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const searchRouter = createTRPCRouter({
  feed: publicProcedure.input(z.string()).query(async ({ input: search }) => {
    if (!search) return { feeds: [] };

    const res = await fetch(`${process.env.FEED_SEARCH_URL}?q=${search}`);

    if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);

    const data = (await res.json()) as {
      feeds: AppBskyFeedDefs.GeneratorView[];
    };

    return data;
  }),
});
