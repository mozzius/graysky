import { DidResolver } from "@atproto/identity";
import { verifyJwt } from "@atproto/xrpc-server";
import { track } from "@vercel/analytics/server";
import { z } from "zod";

import { TranslationService } from "@graysky/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

const didResolver = new DidResolver({
  plcUrl: "https://plc.directory",
});

export const translateRouter = createTRPCRouter({
  post: publicProcedure
    .input(
      z.object({
        uri: z.string(),
        text: z.string(),
        target: z.string(),
        session: z.string().optional(),
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
      let isPro = false;

      if (input.session) {
        try {
          const decoded = await verifyJwt(
            input.session,
            null,
            async (did: string) => {
              return didResolver.resolveAtprotoKey(did);
            },
          );

          const account = await db.account.findUnique({
            where: { did: decoded.iss },
          });

          if (account) {
            isPro = account.pro;
          }
        } catch (err) {
          console.error(err);
        }
      }

      const langNames = new Intl.DisplayNames([input.target], {
        type: "language",
      });

      const cached = await db.translatablePost.findFirst({
        where: {
          uri: input.uri,
        },
        include: {
          translation: {
            where: {
              language: input.target,
            },
          },
        },
      });

      if (cached?.translation[0]) {
        if (
          !isPro ||
          cached.translation[0].service === TranslationService.DEEPL
        ) {
          return {
            text: cached.translation[0].text,
            language: langNames.of(cached.language),
            languageCode: cached.language,
          };
        }
      }

      await track("translate post", {
        uri: input.uri,
      });

      // TODO: FORK HERE AND FETCH FROM DEEPL INSTEAD IF PRO

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
        data: { translations: unknown[] };
      };

      const parsed = z
        .object({
          translatedText: z.string(),
          detectedSourceLanguage: z.string(),
        })
        .parse(data.translations[0]);

      await db.postTranslation.create({
        data: {
          language: input.target,
          text: parsed.translatedText,
          post: {
            connectOrCreate: {
              where: {
                uri: input.uri,
              },
              create: {
                uri: input.uri,
                language: parsed.detectedSourceLanguage,
              },
            },
          },
        },
      });

      if (cached?.language !== parsed.detectedSourceLanguage) {
        await db.translatablePost.update({
          where: {
            uri: input.uri,
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
