import { track } from "@vercel/analytics/server";
import { z } from "zod";

import { TranslationService } from "@graysky/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const translateRouter = createTRPCRouter({
  post: publicProcedure
    .input(
      z.object({
        uri: z.string(),
        text: z.string(),
        target: z.string(),
        service: z
          .union([z.literal("GOOGLE"), z.literal("DEEPL")])
          .optional()
          .default("GOOGLE"),
      }),
    )
    .output(
      z.object({
        text: z.string(),
        language: z.string().default("Unknown"),
        languageCode: z.string(),
      }),
    )
    .mutation(async ({ input, ctx: { db } }) => {
      const langNames = new Intl.DisplayNames([input.target], {
        type: "language",
      });

      const cached = await db.postTranslation.findFirst({
        where: {
          AND: [
            { postUri: input.uri },
            { language: input.target },
            { service: input.service },
          ],
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

      await track("translate post", {
        uri: input.uri,
      });

      let translatedText;
      let detectedSourceLanguage;

      switch (input.service) {
        case TranslationService.GOOGLE: {
          const res = await fetch(
            "https://translation.googleapis.com/language/translate/v2",
            {
              method: "POST",
              headers: new Headers({
                "Content-Type": "application/json",
                "X-goog-api-key": process.env.GOOGLE_API_KEY!,
              }),
              body: JSON.stringify({
                q: input.text,
                target: input.target,
                format: "text",
              }),
            },
          );
          if (!res.ok) throw new Error("API call to gcloud failed");
          const { data } = (await res.json()) as {
            data: {
              translations: {
                translatedText: string;
                detectedSourceLanguage: string;
              }[];
            };
          };
          if (data.translations[0]) {
            translatedText = data.translations[0].translatedText;
            detectedSourceLanguage =
              data.translations[0].detectedSourceLanguage;
          }
          break;
        }
        case TranslationService.DEEPL: {
          const res = await fetch("https://api.deepl.com/v2/translate", {
            method: "POST",
            headers: new Headers({
              "Content-Type": "application/json",
              Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
            }),
            body: JSON.stringify({
              text: [input.text],
              target_lang: input.target,
              preserve_formatting: true,
            }),
          });
          if (!res.ok) throw new Error("API call to deepl failed");
          const data = (await res.json()) as {
            translations: {
              detected_source_language: string;
              text: string;
            }[];
          };
          if (data.translations[0]) {
            translatedText = data.translations[0].text;
            detectedSourceLanguage =
              data.translations[0].detected_source_language.toLocaleLowerCase();
          }
          break;
        }
      }

      if (translatedText === undefined || detectedSourceLanguage === undefined)
        throw new Error("Translation failed");

      await db.postTranslation.create({
        data: {
          language: input.target,
          text: translatedText,
          service: input.service,
          post: {
            connectOrCreate: {
              where: {
                uri: input.uri,
              },
              create: {
                uri: input.uri,
                language: detectedSourceLanguage,
              },
            },
          },
        },
      });

      return {
        text: translatedText,
        language: langNames.of(detectedSourceLanguage),
        languageCode: detectedSourceLanguage,
      };
    }),
});
