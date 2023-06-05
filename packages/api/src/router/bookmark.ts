import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const bookmarkRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        user: z.string().length(32),
        post: z.string(),
      }),
    )
    .mutation(async ({ input, ctx: { db, schema } }) => {
      await db.insert(schema.users).values({
        did: input.user,
      });
      await db.insert(schema.bookmarks).values({
        postUri: input.post,
        userDid: input.user,
      });
    }),
});
