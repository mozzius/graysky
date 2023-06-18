import { bookmarkRouter } from "./router/bookmark";
import { searchRouter } from "./router/search";
import { translateRouter } from "./router/translate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  bookmark: bookmarkRouter,
  translate: translateRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
