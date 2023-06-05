import { bookmarkRouter } from "./router/bookmark";
import { createTRPCRouter } from "./trpc";

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  bookmark: bookmarkRouter,
});
