import React from "react";
import Constants from "expo-constants";
import {
  defaultContext,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@graysky/api";

/**
 * A set of typesafe hooks for consuming your API.
 */
export const api = createTRPCReact<AppRouter>({
  reactQueryContext: defaultContext,
});
export { type RouterInputs, type RouterOutputs } from "@graysky/api";

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
export const getBaseUrl = () => {
  return process.env.API_URL ?? "http://localhost:3000";
};

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
};
