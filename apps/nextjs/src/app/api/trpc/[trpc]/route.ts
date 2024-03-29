import { type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@graysky/api";

// export const runtime = "edge";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: req,
    createContext: createTRPCContext,
    onError({ error }) {
      console.error("tRPC error:", error);
      if (error.code === "INTERNAL_SERVER_ERROR") {
        Sentry.captureException(error);
      }
    },
  });

export { handler as GET, handler as POST };
