import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { showToastable } from "react-native-toastable";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  currentDatetimeString,
  type $Typed,
  type AtUriString,
  type BlobRef,
  type Client,
  type HandleString,
  type UriString,
} from "@atproto/lex";
import { post as createPost } from "@bsky/sdk";
import { app, com } from "@bsky/sdk/lexicons";
import { RichText } from "@bsky/sdk/richtext";
import { type I18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import Sentry from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAgent } from "../agent";
import {
  useMostRecentLanguage,
  usePrimaryLanguage,
} from "../storage/app-preferences";
import { isType } from "../utils/types";
import { uploadBlob } from "../utils/upload-blob";
import { useComposerState } from "./state";

export const MAX_IMAGES = 4;
export const MAX_LENGTH = 300;

const MAX_SIZE = 976_560;
const MAX_DIMENSION = 2048;

export interface ImageWithAlt {
  asset: ImagePicker.ImagePickerAsset;
  alt: string;
}

const strongRefSchema = z.object({
  cid: z.string(),
  uri: z.string(),
});

const replyRefSchema = z.object({
  root: strongRefSchema,
  parent: strongRefSchema,
});
const getReplyRef = (post: app.bsky.feed.defs.PostView) => {
  if (isType(app.bsky.feed.post, post.record)) {
    return post.record.reply;
  }
};

export const useComposer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return {
    open: () => router.push("/composer"),
    reply: (post: app.bsky.feed.defs.PostView) => {
      if (post.viewer?.replyDisabled) {
        Alert.alert(
          "Replying disabled",
          "This post has been threadgated, so you cannot reply to it",
        );
        return;
      }
      queryClient.setQueryData(["context", post.uri], {
        post,
      } satisfies app.bsky.feed.defs.ThreadViewPost);

      const parent = {
        uri: post.uri,
        cid: post.cid,
      } satisfies com.atproto.repo.strongRef.Main;

      const root = getReplyRef(post)?.root ?? parent;

      const replyRef = {
        parent,
        root,
      } satisfies app.bsky.feed.post.ReplyRef;

      router.push(
        `/composer?reply=${encodeURIComponent(JSON.stringify(replyRef))}`,
      );
    },
    quote: (ref: com.atproto.repo.strongRef.Main) =>
      router.push(`/composer?quote=${encodeURIComponent(JSON.stringify(ref))}`),
  };
};

export const useReply = (reply?: string) => {
  const ref = reply
    ? (replyRefSchema.parse(
        JSON.parse(decodeURIComponent(reply)),
      ) as app.bsky.feed.post.ReplyRef)
    : undefined;

  const thread = useContextualPost(ref?.parent.uri);

  return { thread, ref };
};

export const useQuote = (quote?: string) => {
  const ref = quote
    ? ({
        $type: "app.bsky.embed.record",
        record: strongRefSchema.parse(
          JSON.parse(decodeURIComponent(quote)),
        ) as com.atproto.repo.strongRef.Main,
      } satisfies $Typed<app.bsky.embed.record.Main>)
    : undefined;

  const thread = useContextualPost(ref?.record.uri);

  return { thread, ref };
};

const useContextualPost = (uri?: string) => {
  const agent = useAgent();

  const thread = useQuery({
    queryKey: ["context", uri],
    queryFn: async () => {
      if (!uri) return null;
      const { thread } = await agent.call(app.bsky.feed.getPostThread, {
        uri: uri as AtUriString,
      });
      if (!isType(app.bsky.feed.defs.threadViewPost, thread))
        throw new Error("Invalid post");
      return thread;
    },
  });

  return thread;
};

export const useSendPost = ({
  text,
  images,
  external,
  reply,
  quote,
}: {
  text: string;
  images: ImageWithAlt[];
  external?: ReturnType<typeof useExternal>["external"]["query"]["data"];
  reply?: app.bsky.feed.post.ReplyRef;
  quote?: $Typed<app.bsky.embed.record.Main>;
}) => {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const primaryLanguage = usePrimaryLanguage();
  const mostRecentLanguage = useMostRecentLanguage();
  const [{ labels, languages, gif, threadgate }] = useComposerState();
  const { _ } = useLingui();

  return useMutation({
    mutationKey: ["send"],
    mutationFn: async () => {
      if (!agent.did) throw new Error("Not logged in");

      await new Promise((resolve) => setTimeout(resolve, 50));

      const rt = await generateRichText(text.trimEnd(), agent);
      if (rt.graphemeLength > MAX_LENGTH) {
        throw new Error(
          _(
            msg`Your post is too long - there is a character limit of 300 characters`,
          ),
        );
      }

      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          const uri = await compressToMaxSize(img);

          let blob;
          try {
            blob = await uploadBlob(agent, uri, "image/jpeg");
          } catch (err) {
            throw new Error(_(msg`Failed to upload image`), { cause: err });
          }
          return {
            image: blob,
            alt: img.alt.trim(),
            aspectRatio: {
              // note: may not be the size of the compressed image,
              // but it just has to be proportional
              width: img.asset.width,
              height: img.asset.height,
            },
          } satisfies app.bsky.embed.images.Image;
        }),
      );

      const media =
        uploadedImages.length > 0
          ? ({
              $type: "app.bsky.embed.images",
              images: uploadedImages,
            } satisfies $Typed<app.bsky.embed.images.Main>)
          : undefined;

      // upload thumbnail. `external` is query data, so copy rather than mutate
      let embed = external;

      try {
        if (external?.type === "external" && external.view.external.thumb) {
          const thumbUrl = external.view.external.thumb;
          let thumb: BlobRef | undefined;

          const thumbUri = await downloadThumbnail(thumbUrl);
          let encoding: `${string}/${string}` | undefined;
          if (thumbUri.endsWith(".png")) {
            encoding = "image/png";
          } else if (thumbUri.endsWith(".jpeg") || thumbUri.endsWith(".jpg")) {
            encoding = "image/jpeg";
          } else {
            console.warn(`Unknown thumbnail extension, skipping: ${thumbUri}`);
            Sentry.captureMessage(
              `Unknown thumbnail extension, skipping: ${thumbUri}`,
              { level: "warning" },
            );
          }
          if (encoding) {
            try {
              thumb = await uploadBlob(agent, thumbUri, encoding);
            } catch (err) {
              console.warn("thumbnail upload failed", err);
            }
          }

          embed = {
            ...external,
            main: {
              ...external.main,
              external: { ...external.main.external, thumb },
            },
          };
        }
      } catch (err) {
        console.error("thumbnail upload failed", err);
        Sentry.captureException(err);
      }

      let mergedEmbed: app.bsky.feed.post.Main["embed"];

      // embed priorities
      // 1. quote with media
      // 2. quote
      // 3. media
      // 4. external

      if (quote) {
        if (gif) {
          mergedEmbed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: quote,
            media: gif.main,
          } satisfies $Typed<app.bsky.embed.recordWithMedia.Main>;
        } else if (media) {
          mergedEmbed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: quote,
            media,
          } satisfies $Typed<app.bsky.embed.recordWithMedia.Main>;
        } else if (embed?.type === "external") {
          mergedEmbed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: quote,
            media: embed.main,
          } satisfies $Typed<app.bsky.embed.recordWithMedia.Main>;
        } else {
          mergedEmbed = quote;
        }
      } else if (gif?.main) {
        mergedEmbed = gif.main;
      } else if (media) {
        if (embed?.type === "record") {
          mergedEmbed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: embed.main,
            media,
          } satisfies $Typed<app.bsky.embed.recordWithMedia.Main>;
        } else {
          mergedEmbed = media;
        }
      } else if (embed) {
        mergedEmbed = embed.main;
      }

      let selfLabels: $Typed<com.atproto.label.defs.SelfLabels> | undefined;
      if (labels?.length) {
        selfLabels = {
          $type: "com.atproto.label.defs#selfLabels",
          values: labels.map((val) => ({ val })),
        };
      }

      const post = await agent.call(createPost, {
        text: rt.text,
        facets: rt.facets,
        reply,
        embed: mergedEmbed,
        langs: languages ?? [mostRecentLanguage ?? primaryLanguage],
        labels: selfLabels,
      });

      if (threadgate.length > 0) {
        const allow: NonNullable<app.bsky.feed.threadgate.Main["allow"]> = [];
        if (!threadgate.find((v) => v.type === "nobody")) {
          for (const rule of threadgate) {
            if (rule.type === "mention") {
              allow.push({ $type: "app.bsky.feed.threadgate#mentionRule" });
            } else if (rule.type === "following") {
              allow.push({ $type: "app.bsky.feed.threadgate#followingRule" });
            } else if (rule.type === "list") {
              allow.push({
                $type: "app.bsky.feed.threadgate#listRule",
                list: rule.list as AtUriString,
              });
            }
          }
        }

        const rkey = post.uri.split("/").pop();
        if (!rkey) throw new Error("Invalid post uri");
        await agent.create(
          app.bsky.feed.threadgate,
          { post: post.uri, createdAt: currentDatetimeString(), allow },
          { rkey },
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push("../");
      showToastable({
        message: _(msg`Post published!`),
      });
    },
    onError: (err) => Sentry.captureException(err),
  });
};

export const useImages = () => {
  const [images, setImages] = useState<ImageWithAlt[]>([]);
  const { _, i18n } = useLingui();

  const imagePicker = useMutation({
    mutationFn: async (action: "camera" | "gallery") => {
      if (images.length >= MAX_IMAGES) return;

      switch (action) {
        case "camera":
          if (!(await getCameraPermission(i18n))) {
            return;
          }
          void ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            exif: false,
            quality: 0.7,
          }).then((result) => {
            if (!result.canceled) {
              setImages((prev) => [
                ...prev,
                ...result.assets.map((a) => ({ asset: a, alt: "" })),
              ]);
            }
          });
          break;
        case "gallery":
          if (!(await getGalleryPermission(i18n))) {
            return;
          }
          void ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            exif: false,
            quality: 0.7,
            orderedSelection: true,
            legacy: true,
          }).then((result) => {
            if (!result.canceled) {
              setImages((prev) => {
                // max images prop not enforced on android due to the `browse` patch
                if (result.assets.length + prev.length > MAX_IMAGES) {
                  showToastable({
                    title: _(msg`Too many images selected`),
                    message: _(
                      msg`You can only attach up to ${MAX_IMAGES} images, additional images will be ignored`,
                    ),
                  });
                }
                return [
                  ...prev,
                  ...result.assets
                    .slice(0, MAX_IMAGES - prev.length)
                    .map((a) => ({ asset: a, alt: "" })),
                ];
              });
            }
          });
          break;
      }
    },
  });

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const addAltText = useCallback(
    (index: number, alt: string) => {
      setImages((prev) => {
        const copy = [...prev];
        if (!copy[index]) throw new Error("Invalid index");
        copy[index].alt = alt;
        return copy;
      });
    },
    [setImages],
  );

  // const handlePaste = useCallback(
  //   async (err: string | null, files: PastedFile[]) => {
  //     if (images.length >= MAX_IMAGES) return;

  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     const uris = files.map((f) => f.uri);
  //     const uri = uris.find((uri) => /\.(jpg|jpeg|png).*$/.test(uri));

  //     if (uri) {
  //       try {
  //         const { width, height } = await new Promise<{
  //           width: number;
  //           height: number;
  //         }>((resolve, reject) => {
  //           Image.getSize(
  //             uri,
  //             (width, height) => {
  //               resolve({ width, height });
  //             },
  //             reject,
  //           );
  //         });
  //         setImages((prev) => [
  //           ...prev,
  //           {
  //             asset: {
  //               uri,
  //               width,
  //               height,
  //             },
  //             alt: "",
  //           },
  //         ]);
  //       } catch (err) {
  //         Sentry.captureException(err);
  //         return;
  //       }
  //     }
  //   },
  //   [images.length],
  // );

  return {
    images,
    imagePicker,
    removeImage,
    addAltText,
    // handlePaste,
  };
};

export const generateRichText = async (text: string, agent: Client) => {
  const rt = new RichText({ text });
  await rt.detectFacets(agent);
  return rt;
};

export const getGalleryPermission = async (i18n: I18n) => {
  const canChoosePhoto = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!canChoosePhoto.granted) {
    if (canChoosePhoto.canAskAgain) {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        showToastable({
          title: i18n._(msg`Permission required`),
          message: i18n._(
            msg`Please enable photo gallery access in your settings`,
          ),
          status: "warning",
        });
        return false;
      }
    } else {
      showToastable({
        title: i18n._(msg`Permission required`),
        message: i18n._(
          msg`Please enable photo gallery access in your settings`,
        ),
        status: "warning",
      });
      return false;
    }
  }
  return true;
};

export const getCameraPermission = async (i18n: I18n) => {
  const canTakePhoto = await ImagePicker.getCameraPermissionsAsync();
  if (!canTakePhoto.granted) {
    if (canTakePhoto.canAskAgain) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        showToastable({
          title: i18n._(msg`Permission required`),
          message: i18n._(msg`Please enable camera access in your settings`),
          status: "warning",
        });
        return false;
      }
    } else {
      showToastable({
        title: i18n._(msg`Permission required`),
        message: i18n._(msg`Please enable camera access in your settings`),
        status: "warning",
      });
      return false;
    }
  }
  return true;
};

export const compress = async ({
  uri,
  width,
  height,
  needsResize,
}: {
  uri: string;
  width?: number;
  height?: number;
  needsResize: boolean;
}) => {
  const current = uri;
  // compress iteratively, reducing quality each time
  for (let i = 10; i > 0; i--) {
    try {
      // Float precision - not sure what's going on here
      const factor = Math.round(i) / 10;
      const compressed = await ImageManipulator.manipulateAsync(
        current,
        needsResize ? [{ resize: { width, height } }] : [],
        {
          compress: factor,
          base64: true,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      if (!compressed.base64) throw new Error("Failed to compress");

      const compressedSize = Math.round((compressed.base64?.length * 3) / 4);

      if (compressedSize < MAX_SIZE) {
        return compressed.uri;
      }
    } catch (err) {
      throw new Error("Failed to resize", { cause: err });
    }
  }
  throw new Error("Failed to compress - image may be incompressable");
};

const compressToMaxSize = async (image: ImageWithAlt) => {
  let uri = image.asset.uri;
  const size = image.asset.fileSize ?? MAX_SIZE + 1;
  let targetWidth,
    targetHeight = MAX_DIMENSION;

  const needsResize =
    image.asset.width > MAX_DIMENSION || image.asset.height > MAX_DIMENSION;

  if (image.asset.width > image.asset.height) {
    targetHeight = image.asset.height * (MAX_DIMENSION / image.asset.width);
  } else {
    targetWidth = image.asset.width * (MAX_DIMENSION / image.asset.height);
  }

  // compress if > 1mb

  if (size > MAX_SIZE) {
    uri = await compress({
      uri: image.asset.uri,
      width: targetWidth,
      height: targetHeight,
      needsResize,
    });
  }

  return uri;
};

export const useExternal = (facets: app.bsky.richtext.facet.Main[] = []) => {
  const [selectedEmbed, selectEmbed] = useState<string | null>(null);
  const agent = useAgent();

  const set = new Set<string>();

  for (const facet of facets) {
    for (const feature of facet.features) {
      if (isType(app.bsky.richtext.facet.link, feature)) {
        set.add(feature.uri);
      }
    }
  }

  const urls = Array.from(set);

  const embed = useQuery({
    enabled: !!selectedEmbed,
    queryKey: ["embed", selectedEmbed],
    queryFn: async (): Promise<
      | {
          type: "record";
          view: $Typed<app.bsky.embed.record.View>;
          main: $Typed<app.bsky.embed.record.Main>;
        }
      | {
          type: "external";
          view: $Typed<app.bsky.embed.external.View>;
          main: $Typed<app.bsky.embed.external.Main>;
        }
      | null
    > => {
      if (!selectedEmbed) return null;

      // check if it's a url via zod
      if (!z.string().trim().url().safeParse(selectedEmbed).success)
        return null;

      const url = new URL(selectedEmbed.trim());

      const [_0, handle, type, rkey] = url.pathname.split("/").filter(Boolean);

      if (url.hostname === "bsky.app" && handle && type && rkey) {
        let did = handle;
        if (did && !did.startsWith("did:")) {
          const data = await agent.call(com.atproto.identity.resolveHandle, {
            handle: did as HandleString,
          });
          did = data.did;
        }

        switch (type) {
          case "post": {
            const { thread } = await agent.call(app.bsky.feed.getPostThread, {
              uri: `at://${did}/app.bsky.feed.post/${rkey}` as AtUriString,
            });

            if (
              isType(app.bsky.feed.defs.blockedPost, thread) ||
              isType(app.bsky.feed.defs.notFoundPost, thread)
            ) {
              return null;
            }

            if (isType(app.bsky.feed.defs.threadViewPost, thread)) {
              return {
                type: "record",
                view: {
                  $type: "app.bsky.embed.record#view",
                  record: {
                    $type: "app.bsky.embed.record#viewRecord",
                    author: thread.post.author,
                    uri: thread.post.uri,
                    cid: thread.post.cid,
                    indexedAt: thread.post.indexedAt,
                    labels: thread.post.labels,
                    value: thread.post.record,
                    embeds: thread.post.embed ? [thread.post.embed] : undefined,
                  } satisfies app.bsky.embed.record.ViewRecord,
                } satisfies app.bsky.embed.record.View,
                main: {
                  $type: "app.bsky.embed.record",
                  record: {
                    uri: thread.post.uri,
                    cid: thread.post.cid,
                  },
                } satisfies app.bsky.embed.record.Main,
              };
            }

            return null;
          }
          case "feed": {
            const generator = await agent.call(app.bsky.feed.getFeedGenerator, {
              feed: `at://${did}/app.bsky.feed.generator/${rkey}` as AtUriString,
            });

            return {
              type: "record",
              view: {
                $type: "app.bsky.embed.record#view",
                record: {
                  ...generator.view,
                  $type: "app.bsky.feed.defs#generatorView",
                },
              } satisfies app.bsky.embed.record.View,
              main: {
                $type: "app.bsky.embed.record",
                record: {
                  uri: generator.view.uri,
                  cid: generator.view.cid,
                },
              } satisfies app.bsky.embed.record.Main,
            };
          }
          default:
            return null;
        }
      } else {
        // fetch external embed
        // uses the cardyb api (lol)

        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 5e3);

        const response = await fetch(
          `https://cardyb.bsky.app/v1/extract?url=${encodeURIComponent(
            url.toString(),
          )}`,
          { signal: controller.signal },
        );

        const body = (await response.json()) as {
          description?: string;
          error?: string;
          image?: string;
          title?: string;
        };
        clearTimeout(to);

        const { error, title = "", description = "", image } = body;

        if (error) throw new Error(error);

        return {
          type: "external",
          view: {
            $type: "app.bsky.embed.external#view",
            external: {
              $type: "app.bsky.embed.external#viewExternal",
              uri: url.toString() as UriString,
              title,
              description,
              thumb: image as UriString | undefined,
            } satisfies app.bsky.embed.external.ViewExternal,
          } satisfies app.bsky.embed.external.View,
          main: {
            $type: "app.bsky.embed.external",
            external: {
              $type: "app.bsky.embed.external#external",
              uri: url.toString() as UriString,
              title,
              description,
              // thumb is filled in later
              thumb: undefined,
            } satisfies app.bsky.embed.external.External,
          } satisfies app.bsky.embed.external.Main,
        };
      }
    },
  });

  return {
    potentialExternalEmbeds: urls,
    external: {
      url: selectedEmbed,
      query: embed,
    },
    selectExternal: selectEmbed,
    hasExternal: urls.length > 0 || !!selectedEmbed,
  };
};

const downloadThumbnail = async (url: string) => {
  let appendExt = "jpeg";
  try {
    const urip = new URL(url);
    const ext = urip.pathname.split(".").pop();
    if (ext === "png") {
      appendExt = "png";
    }
  } catch (err) {
    throw new Error(`Invalid url: ${url}`, { cause: err });
  }

  if (!FileSystem.cacheDirectory) throw new Error("No cache directory");
  const localUri = `${FileSystem.cacheDirectory}thumb-${Date.now()}.${appendExt}`;
  try {
    await FileSystem.downloadAsync(url, localUri);

    return await compress({
      uri: localUri,
      needsResize: true,
      width: MAX_DIMENSION / 2,
    });
  } finally {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  }
};
