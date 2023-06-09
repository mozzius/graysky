import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const translateRouter = createTRPCRouter({
  detect: publicProcedure
    .input(
      z.array(
        z.object({
          uri: z.string(),
          text: z.string(),
        }),
      ),
    )
    .mutation(async ({ input: posts }) => {
      const res = await fetch(
        "https://translation.googleapis.com/language/translate/v2/detect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TRANSLATION_KEY}`,
            "x-goog-user-project": `${process.env.TRANSLATION_PROJECT_ID}`,
          },
          body: JSON.stringify({
            q: posts.map((i) => i.text),
          }),
        },
      );
      if (!res.ok) throw new Error("API call to gcloud failed");
      const {
        data: { detections },
      } = await res.json();
      return Object.fromEntries(
        posts.map((post, index) => [
          post.uri,
          detections[index]?.[0]?.language ?? null,
        ]),
      );
    }),
});
