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
    .mutation(async ({ input, ctx: { db } }) => {
      await db.bookmark.create({
        data: {
          uri: input.post,
          actor: {
            connectOrCreate: {
              where: {
                did: input.user,
              },
              create: {
                did: input.user,
              },
            },
          },
        },
      });
    }),
});
