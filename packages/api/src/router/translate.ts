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
    .mutation(async ({ input: posts, ctx: { db } }) => {
      const cached = await db.translatablePost.findMany({
        where: {
          uri: {
            in: posts.map((post) => post.uri),
          },
        },
      });

      const needsDetecting = posts.filter(
        (post) => !cached.some((translation) => translation.uri === post.uri),
      );

      if (needsDetecting.length === 0) {
        return Object.fromEntries(
          cached.map((detected) => [detected.uri, detected.language]),
        );
      }

      const res = await fetch(
        "https://translation.googleapis.com/language/translate/v2/detect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.TRANSLATION_KEY as string,
          },
          body: JSON.stringify({
            q: needsDetecting.map((post) => post.text),
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

      const existingDectections = Object.fromEntries(
        cached
          .map((detected) => [detected.uri, detected.language])
          .filter(([_, language]) => language !== "und"),
      );

      const newDectections = Object.fromEntries(
        needsDetecting
          .map((post, index) => [
            post.uri,
            detections[index]?.[0]?.language as string | undefined,
          ])
          .filter(([_, language]) => language !== "und"),
      );

      await db.translatablePost.createMany({
        data: Object.entries(newDectections)
          .filter(([_, language]) => language !== undefined)
          .map(([uri, language]) => ({
            uri,
            language: language as string,
          })),
      });

      return {
        ...existingDectections,
        ...newDectections,
      };
    }),
  post: publicProcedure
    .input(
      z.object({
        uri: z.string(),
        text: z.string(),
        target: z.string(),
      }),
    )
    .output(
      z.object({
        text: z.string(),
        language: z.string().default("Unknown"),
        languageCode: z.string(),
      }),
    )
    .mutation(async ({ input: post, ctx: { db } }) => {
      const langNames = new Intl.DisplayNames([post.target], {
        type: "language",
      });

      const cached = await db.postTranslation.findFirst({
        where: {
          postUri: post.uri,
          language: post.target,
        },
        include: {
          post: true,
        },
      });

      if (cached) {
        return {
          text: cached.text,
          language: langNames.of(cached.post.language),
          languageCode: cached.post.language,
        };
      }

      const res = await fetch(
        "https://translation.googleapis.com/language/translate/v2",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.TRANSLATION_KEY as string,
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

      await db.postTranslation.create({
        data: {
          language: post.target,
          text: parsed.translatedText,
          post: {
            connectOrCreate: {
              where: {
                uri: post.uri,
              },
              create: {
                uri: post.uri,
                language: parsed.detectedSourceLanguage,
              },
            },
          },
        },
      });

      return {
        text: parsed.translatedText,
        language: langNames.of(parsed.detectedSourceLanguage),
        languageCode: parsed.detectedSourceLanguage,
      };
    }),
});
