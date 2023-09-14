import { bookmarkRouter } from "./router/bookmark";
import { gifsRouter } from "./router/gifs";
import { translateRouter } from "./router/translate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  bookmark: bookmarkRouter,
  translate: translateRouter,
  gifs: gifsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
