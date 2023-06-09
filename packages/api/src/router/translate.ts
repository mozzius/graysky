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
      if (!res.ok) {
        console.log(res.status, res.statusText);
        console.log((await res.json()).error.message);
        throw new Error("API call to gcloud failed");
      }
      const {
        data: { detections },
      } = await res.json();
      return Object.fromEntries(
        posts.map((post, index) => [
          post.uri,
          detections[index]?.[0]?.language as string | undefined,
        ]),
      );
    }),
  post: publicProcedure
    .input(
      z.object({
        uri: z.string(),
        text: z.string(),
        target: z.string(),
      }),
    )
    .mutation(async ({ input: post }) => {
      const res = await fetch(
        "https://translation.googleapis.com/language/translate/v2",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TRANSLATION_KEY}`,
            "x-goog-user-project": `${process.env.TRANSLATION_PROJECT_ID}`,
          }),
          body: JSON.stringify({
            q: post.text,
            target: post.target,
            format: "text",
          }),
        },
      );
      if (!res.ok) throw new Error("API call to gcloud failed");
      const { data } = await res.json();

      const parsed = z
        .object({
          translatedText: z.string(),
          detectedSourceLanguage: z.string(),
        })
        .parse(data.translations[0]);

      const langNames = new Intl.DisplayNames([post.target], {
        type: "language",
      });

      return {
        text: parsed.translatedText,
        language: langNames.of(parsed.detectedSourceLanguage),
        languageCode: parsed.detectedSourceLanguage,
      };
    }),
});
