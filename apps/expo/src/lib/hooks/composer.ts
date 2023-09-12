import { useCallback, useState } from "react";
import { Alert, Keyboard, Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AppBskyFeedDefs,
  AppBskyRichtextFacet,
  RichText,
  type AppBskyEmbedExternal,
  type AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyFeedPost,
  type BlobRef,
  type BskyAgent,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sentry from "sentry-expo";
import { z } from "zod";

import { useAgent } from "../agent";
import { locale } from "../locale";
import { useHaptics } from "./preferences";

export const MAX_IMAGES = 4;
export const MAX_LENGTH = 300;

const MAX_SIZE = 976_560;
const MAX_DIMENSION = 2048;

interface ImageWithAlt {
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

export const useReply = () => {
  const { reply } = useLocalSearchParams<{
    reply?: string;
  }>();

  const ref = reply
    ? replyRefSchema.parse(JSON.parse(decodeURIComponent(reply)))
    : undefined;

  const thread = useContextualPost(ref?.parent.uri);

  return { thread, ref };
};

export const useQuote = () => {
  const { quote } = useLocalSearchParams<{
    quote?: string;
  }>();

  const ref = quote
    ? {
        $type: "app.bsky.embed.record",
        record: strongRefSchema.parse(JSON.parse(decodeURIComponent(quote))),
      }
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
      const post = await agent.getPostThread({ uri });
      if (!post.success) throw new Error("Failed to fetch post");
      if (!AppBskyFeedDefs.isThreadViewPost(post.data.thread))
        throw new Error("Invalid post");
      return post.data.thread;
    },
  });

  return thread;
};

export const useSendPost = ({
  text,
  images,
  reply,
  quote,
  external,
}: {
  text: string;
  images: ImageWithAlt[];
  reply?: AppBskyFeedPost.ReplyRef;
  quote?: AppBskyEmbedRecord.Main;
  external?: AppBskyEmbedRecord.Main | AppBskyEmbedExternal.Main;
}) => {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const haptics = useHaptics();

  return useMutation({
    mutationKey: ["send"],
    mutationFn: async () => {
      if (!agent.hasSession) throw new Error("Not logged in");

      await new Promise((resolve) => setTimeout(resolve, 50));

      const rt = await generateRichText(text.trim(), agent);
      if (rt.graphemeLength > MAX_LENGTH) {
        Alert.alert(
          "Your post is too long",
          "There is a character limit of 300 characters",
        );
        throw new Error("Too long");
      }

      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          let uri = img.asset.uri;
          const size = img.asset.fileSize ?? MAX_SIZE + 1;
          let targetWidth,
            targetHeight = MAX_DIMENSION;

          const needsResize =
            img.asset.width > MAX_DIMENSION || img.asset.height > MAX_DIMENSION;

          if (img.asset.width > img.asset.height) {
            targetHeight = img.asset.height * (MAX_DIMENSION / img.asset.width);
          } else {
            targetWidth = img.asset.width * (MAX_DIMENSION / img.asset.height);
          }

          // compress if > 1mb

          if (size > MAX_SIZE) {
            uri = await compress({
              uri: img.asset.uri,
              width: targetWidth,
              height: targetHeight,
              needsResize,
            });
          }

          const uploaded = await agent.uploadBlob(uri, {
            encoding: "image/jpeg",
          });
          if (!uploaded.success) throw new Error("Failed to upload image");
          return {
            image: uploaded.data.blob,
            alt: img.alt.trim(),
            aspectRatio: {
              // note: may not be the size of the compressed image,
              // but it just has to be proportional
              width: img.asset.width,
              height: img.asset.height,
            },
          } satisfies AppBskyEmbedImages.Image;
        }),
      );

      const media =
        uploadedImages.length > 0
          ? {
              $type: "app.bsky.embed.images",
              images: uploadedImages,
            }
          : undefined;

      let mergedEmbed: AppBskyFeedPost.Record["embed"];

      // embed priorities
      // 1. quote with media
      // 2. quote
      // 3. media
      // 4. external

      if (quote) {
        if (media) {
          mergedEmbed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: quote,
            media,
          } satisfies AppBskyEmbedRecordWithMedia.Main;
        } else {
          mergedEmbed = quote;
        }
      } else if (media) {
        mergedEmbed = media;
      } else if (external) {
        mergedEmbed = external;
      }

      await agent.post({
        text: rt.text,
        facets: rt.facets,
        reply,
        embed: mergedEmbed,
        // TODO: LANGUAGE SELECTOR
        langs: [locale.languageCode],
      });
    },
    onMutate: () => haptics.impact(),
    onSuccess: () => {
      void queryClient.invalidateQueries(["profile"]);
      router.push("../");
    },
    onError: (err) => Sentry.Native.captureException(err),
  });
};

export const useImages = () => {
  const [images, setImages] = useState<ImageWithAlt[]>([]);
  const { showActionSheetWithOptions } = useActionSheet();
  const agent = useAgent();

  const imagePicker = useMutation({
    mutationFn: async () => {
      if (images.length >= MAX_IMAGES) return;

      // hackfix - android crashes if keyboard is open
      if (Platform.OS === "android") {
        Keyboard.dismiss();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // jank feature flag
      const options =
        agent.session?.handle === "mozzius.dev"
          ? ["Take Photo", "Choose from Library", "Search GIFs", "Cancel"]
          : ["Take Photo", "Choose from Library", "Cancel"];
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        async (index) => {
          if (index === undefined) return;
          const selected = options[index];
          switch (selected) {
            case "Take Photo":
              if (!(await getCameraPermission())) {
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
            case "Choose from Library":
              if (!(await getGalleryPermission())) {
                return;
              }
              void ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: MAX_IMAGES - images.length,
                exif: false,
                quality: 0.7,
                orderedSelection: true,
              }).then((result) => {
                if (!result.canceled) {
                  setImages((prev) => [
                    ...prev,
                    ...result.assets.map((a) => ({ asset: a, alt: "" })),
                  ]);
                }
              });
          }
        },
      );
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
        copy[index]!.alt = alt;
        return copy;
      });
    },
    [setImages],
  );

  return {
    images,
    imagePicker,
    removeImage,
    addAltText,
  };
};

export const generateRichText = async (text: string, agent: BskyAgent) => {
  const rt = new RichText({ text });
  await rt.detectFacets(agent);
  return rt;
};

const getGalleryPermission = async () => {
  const canChoosePhoto = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!canChoosePhoto.granted) {
    if (canChoosePhoto.canAskAgain) {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable photo gallery access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable photo gallery access in your settings",
      );
      return false;
    }
  }
  return true;
};

const getCameraPermission = async () => {
  const canTakePhoto = await ImagePicker.getCameraPermissionsAsync();
  if (!canTakePhoto.granted) {
    if (canTakePhoto.canAskAgain) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable camera access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable camera access in your settings",
      );
      return false;
    }
  }
  return true;
};

const compress = async ({
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

export const useExternal = (facets: AppBskyRichtextFacet.Main[] = []) => {
  const [selectedEmbed, selectEmbed] = useState<string | null>(null);
  const agent = useAgent();

  const set = new Set<string>();

  for (const facet of facets) {
    for (const feature of facet.features) {
      if (AppBskyRichtextFacet.isLink(feature)) {
        set.add(feature.uri);
      }
    }
  }

  const urls = Array.from(set);

  const embed = useQuery({
    enabled: !!selectedEmbed,
    queryKey: ["embed", selectedEmbed],
    queryFn: async (): Promise<{
      view: AppBskyEmbedRecord.View | AppBskyEmbedExternal.View;
      main: AppBskyEmbedRecord.Main | AppBskyEmbedExternal.Main;
    } | null> => {
      if (!selectedEmbed) return null;

      // check if it's a url via zod
      if (!z.string().trim().url().safeParse(selectedEmbed).success)
        return null;

      const url = new URL(selectedEmbed.trim());

      const [_0, handle, type, rkey] = url.pathname.split("/").filter(Boolean);

      if (url.hostname === "bsky.app" && handle && type && rkey) {
        let did = handle;
        if (did && !did.startsWith("did:")) {
          const { data } = await agent.resolveHandle({ handle: did });
          did = data.did;
        }

        switch (type) {
          case "post": {
            const data = await agent.getPostThread({
              uri: `at://${did}/app.bsky.feed.post/${rkey}`,
            });
            if (!data.success) return null;

            const thread = data.data.thread;

            if (
              AppBskyFeedDefs.isBlockedPost(thread) ||
              AppBskyFeedDefs.isNotFoundPost(thread)
            ) {
              return null;
            }

            if (AppBskyFeedDefs.isThreadViewPost(thread)) {
              return {
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
                  } satisfies AppBskyEmbedRecord.ViewRecord,
                } satisfies AppBskyEmbedRecord.View,
                main: {
                  $type: "app.bsky.embed.record#main",
                  record: {
                    uri: thread.post.uri,
                    cid: thread.post.cid,
                  },
                } satisfies AppBskyEmbedRecord.Main,
              };
            }

            return null;
          }
          case "feed": {
            const generator = await agent.app.bsky.feed.getFeedGenerator({
              feed: `at://${did}/app.bsky.feed.generator/${rkey}`,
            });

            if (!generator.success) return null;

            return {
              view: {
                $type: "app.bsky.embed.record#view",
                record: generator.data.view,
              } satisfies AppBskyEmbedRecord.View,
              main: {
                $type: "app.bsky.embed.record#main",
                record: {
                  uri: generator.data.view.uri,
                  cid: generator.data.view.cid,
                },
              } satisfies AppBskyEmbedRecord.Main,
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

        let thumb: BlobRef | undefined;

        if (image) {
          // probably need to download first :/
          // const uploaded = await agent.uploadBlob(image);
          // if (!uploaded.success) throw new Error("Failed to upload image");
          // thumb = uploaded.data.blob;
        }

        if (error) throw new Error(error);

        return {
          view: {
            $type: "app.bsky.embed.external#view",
            external: {
              $type: "app.bsky.embed.external#viewExternal",
              uri: url.toString(),
              title,
              description,
              thumb: image,
              url: selectedEmbed,
            } satisfies AppBskyEmbedExternal.ViewExternal,
          } satisfies AppBskyEmbedExternal.View,
          main: {
            $type: "app.bsky.embed.external#main",
            external: {
              $type: "app.bsky.embed.external#external",
              uri: url.toString(),
              title,
              description,
              thumb,
              url: selectedEmbed,
            } satisfies AppBskyEmbedExternal.External,
          } satisfies AppBskyEmbedExternal.Main,
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
