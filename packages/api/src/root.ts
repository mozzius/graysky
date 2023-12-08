import { gifsRouter } from "./router/gifs";
import { translateRouter } from "./router/translate";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  translate: translateRouter,
  gifs: gifsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
