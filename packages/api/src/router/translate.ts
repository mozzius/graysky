import lande, { type Language as Language3 } from "lande";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

type Language2 =
  | "af"
  | "ar"
  | "az"
  | "be"
  | "bn"
  | "bg"
  | "ca"
  | "cs"
  | "ku"
  | "zh"
  | "da"
  | "de"
  | "el"
  | "en"
  | "et"
  | "eu"
  | "fi"
  | "fr"
  | "ha"
  | "he"
  | "hi"
  | "hr"
  | "hu"
  | "hy"
  | "id"
  | "is"
  | "it"
  | "ja"
  | "ka"
  | "kk"
  | "ko"
  | "lt"
  | "mr"
  | "mk"
  | "nl"
  | "nb"
  | "fa"
  | "pl"
  | "pt"
  | "ro"
  | "rn"
  | "ru"
  | "sk"
  | "es"
  | "sr"
  | "sv"
  | "tl"
  | "tr"
  | "uk"
  | "vi";

function iso639_3toIso639_2(string: Language3): Language2 {
  switch (string) {
    case "afr":
      return "af";
    case "ara":
      return "ar";
    case "aze":
      return "az";
    case "bel":
      return "be";
    case "ben":
      return "bn";
    case "bul":
      return "bg";
    case "cat":
      return "ca";
    case "ces":
      return "cs";
    case "ckb":
      return "ku";
    case "cmn":
      return "zh";
    case "dan":
      return "da";
    case "deu":
      return "de";
    case "ell":
      return "el";
    case "eng":
      return "en";
    case "est":
      return "et";
    case "eus":
      return "eu";
    case "fin":
      return "fi";
    case "fra":
      return "fr";
    case "hau":
      return "ha";
    case "heb":
      return "he";
    case "hin":
      return "hi";
    case "hrv":
      return "hr";
    case "hun":
      return "hu";
    case "hye":
      return "hy";
    case "ind":
      return "id";
    case "isl":
      return "is";
    case "ita":
      return "it";
    case "jpn":
      return "ja";
    case "kat":
      return "ka";
    case "kaz":
      return "kk";
    case "kor":
      return "ko";
    case "lit":
      return "lt";
    case "mar":
      return "mr";
    case "mkd":
      return "mk";
    case "nld":
      return "nl";
    case "nob":
      return "nb";
    case "pes":
      return "fa";
    case "pol":
      return "pl";
    case "por":
      return "pt";
    case "ron":
      return "ro";
    case "run":
      return "rn";
    case "rus":
      return "ru";
    case "slk":
      return "sk";
    case "spa":
      return "es";
    case "srp":
      return "sr";
    case "swe":
      return "sv";
    case "tgl":
      return "tl";
    case "tur":
      return "tr";
    case "ukr":
      return "uk";
    case "vie":
      return "vi";
  }
}

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

      const detections = needsDetecting
        .map((post) => {
          const detected = lande(post.text);
          if (!detected[0]) return undefined;
          if (detected[0][1] < 0.5) return undefined;
          return [post.uri, iso639_3toIso639_2(detected[0][0])];
        })
        .filter(Boolean) as [string, string][];

      const newDectections = Object.fromEntries(detections);

      const existingDectections = Object.fromEntries(
        cached
          .map((detected) => [detected.uri, detected.language])
          .filter(([_, language]) => language !== "und"),
      );

      await db.translatablePost.createMany({
        data: detections.map(([uri, language]) => ({
          uri,
          language: language as string,
        })),
        skipDuplicates: true,
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
