import { bookmarkRouter } from "./router/bookmark";
import { translateRouter } from "./router/translate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  bookmark: bookmarkRouter,
  translate: translateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
