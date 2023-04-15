import { uselessRouter } from "./router/useless";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  useless: uselessRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
