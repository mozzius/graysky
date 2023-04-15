import { createTRPCRouter, publicProcedure } from "../trpc";

export const uselessRouter = createTRPCRouter({
  ping: publicProcedure.query(() => "pong"),
});
