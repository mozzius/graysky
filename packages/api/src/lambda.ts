import { edgeRouter } from "./edge";
import { createTRPCRouter } from "./trpc";

// Deployed to /trpc/lambda/**
export const lambdaRouter = createTRPCRouter({
  edge: edgeRouter,
});
