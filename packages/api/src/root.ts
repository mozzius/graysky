import { bookmarkRouter } from "./router/bookmark";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  bookmark: bookmarkRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
