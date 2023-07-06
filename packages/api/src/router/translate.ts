import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const translateRouter = createTRPCRouter({
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

      const cached = await db.translatablePost.findFirst({
        where: {
          uri: post.uri,
        },
        include: {
          translation: {
            where: {
              language: post.target,
            },
          },
        },
      });

      if (cached && cached.translation[0]) {
        return {
          text: cached.translation[0].text,
          language: langNames.of(cached.language),
          languageCode: cached.language,
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

      if (cached?.language !== parsed.detectedSourceLanguage) {
        await db.translatablePost.update({
          where: {
            uri: post.uri,
          },
          data: {
            language: parsed.detectedSourceLanguage,
          },
        });
      }

      return {
        text: parsed.translatedText,
        language: langNames.of(parsed.detectedSourceLanguage),
        languageCode: parsed.detectedSourceLanguage,
      };
    }),
});
