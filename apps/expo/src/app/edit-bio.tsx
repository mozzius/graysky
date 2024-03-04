import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import {
  openPicker,
  type Image as CroppedImage,
} from "react-native-image-crop-picker";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { RichText as RichTextHelper } from "@atproto/api";
import { type I18n } from "@lingui/core";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlusIcon, XIcon } from "lucide-react-native";

import { QueryWithoutData } from "~/components/query-without-data";
import { RichText } from "~/components/rich-text";
import KeyboardAwareScrollView from "~/components/scrollview/keyboard-aware-scrollview";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { useAgent } from "~/lib/agent";
import { compress, getGalleryPermission } from "~/lib/composer/utils";
import { cx } from "~/lib/utils/cx";
import { useSelf } from "./settings/account";

const MAX_DISPLAY_NAME = 64;
const MAX_DESCRIPTION = 256;

export default function EditBio() {
  const theme = useTheme();
  const agent = useAgent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { _, i18n } = useLingui();

  const self = useSelf();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<CroppedImage | null>(null);
  const [banner, setBanner] = useState<CroppedImage | null>(null);

  useEffect(() => {
    if (self.data) {
      setDisplayName((d) => (d === null ? self.data.displayName ?? "" : d));
      setDescription((d) => (d === null ? self.data.description ?? "" : d));
    }
  }, [self.data]);

  const rt = new RichTextHelper({ text: description ?? "" });
  rt.detectFacetsWithoutResolution();

  const { mutate: save, isPending: saving } = useMutation({
    mutationKey: ["save-profile"],
    mutationFn: async () => {
      await agent.upsertProfile(async (old) => {
        let newBanner, newAvatar;
        if (banner) {
          const uploadedBanner = await agent.uploadBlob(
            await compress({
              uri: banner.path,
              needsResize: false,
            }),
            {
              encoding: "image/jpeg",
            },
          );
          newBanner = uploadedBanner.data.blob;
        }
        if (avatar) {
          const uploadedAvatar = await agent.uploadBlob(
            await compress({
              uri: avatar.path,
              needsResize: false,
            }),
            {
              encoding: "image/jpeg",
            },
          );
          newAvatar = uploadedAvatar.data.blob;
        }
        return {
          ...old,
          banner: newBanner ?? old?.banner,
          avatar: newAvatar ?? old?.avatar,
          displayName: displayName?.trim() ?? "",
          description: description?.trim() ?? "",
        };
      });
    },
    onSettled: () => {
      router.push("../");
      void queryClient.invalidateQueries({ queryKey: ["self"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const dirty = useMemo(() => {
    return (
      self.data?.displayName !== displayName?.trim() ||
      self.data?.description !== description?.trim() ||
      avatar ||
      banner
    );
  }, [self.data, displayName, description, avatar, banner]);

  const cancelButton = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => router.push("../")}
        className={Platform.select({
          android: "mr-3",
        })}
      >
        {Platform.select({
          ios: (
            <Text className="text-lg font-medium" primary>
              <Trans>Cancel</Trans>
            </Text>
          ),
          default: <XIcon color={theme.colors.text} size={24} />,
        })}
      </TouchableOpacity>
    ),
    [router, theme.colors.text],
  );

  const saveButton = useCallback(
    () => (
      <TouchableOpacity onPress={() => save()} disabled={!dirty || saving}>
        <Text
          className={cx(
            "text-lg font-medium",
            (!dirty || saving) && "text-neutral-500",
          )}
          primary
        >
          <Trans>Save</Trans>
        </Text>
      </TouchableOpacity>
    ),
    [save, dirty, saving],
  );

  const editAvatar = useCallback(async () => {
    const image = await getImage(i18n, [1, 1], true).catch(() => null);
    if (!image) return;
    setAvatar(image);
  }, [i18n]);

  const editBanner = useCallback(async () => {
    const image = await getImage(i18n, [1, 3]).catch(() => null);
    if (!image) return;
    setBanner(image);
  }, [i18n]);

  if (self.data) {
    return (
      <KeyboardAwareScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
      >
        <StatusBar modal />
        <Stack.Screen
          options={{
            headerBackButtonMenuEnabled: false,
            headerLeft: cancelButton,
            headerRight: saveButton,
            gestureEnabled: !dirty,
          }}
        />
        <View className="relative h-32">
          <TouchableHighlight
            onPress={editBanner}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Edit banner`)}
          >
            <View className="relative h-full w-full bg-blue-500">
              <Image
                source={banner?.path ?? self.data.banner}
                className="h-full w-full"
                contentFit="cover"
              />
              {!banner && (
                <View className="absolute h-full w-full items-center justify-center bg-black/40">
                  <ImagePlusIcon color="white" size={32} />
                </View>
              )}
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            onPress={editAvatar}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Edit avatar`)}
          >
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.card,
              }}
              className="absolute -bottom-12 left-4 h-24 w-24 rounded-full border-2"
            >
              <View className="relative h-full w-full rounded-full bg-blue-500">
                <Image
                  source={avatar?.path ?? self.data.avatar}
                  className="h-full w-full rounded-full"
                  contentFit="cover"
                />
                {!avatar && (
                  <View className="absolute h-full w-full items-center justify-center rounded-full bg-black/40">
                    <ImagePlusIcon color="white" size={32} />
                  </View>
                )}
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View className="mt-10 flex-1 px-4">
          <View className="my-4 flex-1">
            <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
              <Trans>Display name</Trans>
            </Text>
            <View
              style={{ backgroundColor: theme.colors.card }}
              className="flex-1 overflow-hidden rounded-lg"
            >
              <TextInput
                value={displayName ?? ""}
                placeholder="Required"
                onChange={(evt) => setDisplayName(evt.nativeEvent.text)}
                className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                maxLength={MAX_DISPLAY_NAME}
              />
            </View>
          </View>
          <View className="mb-4 flex-1">
            <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
              <Trans>Description</Trans>
            </Text>
            <View
              style={{ backgroundColor: theme.colors.card }}
              className="flex-1 overflow-hidden rounded-lg"
            >
              <TextInput
                onChange={(evt) => setDescription(evt.nativeEvent.text)}
                placeholder="Optional"
                multiline
                className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                maxLength={MAX_DESCRIPTION}
              >
                <RichText
                  size="base"
                  text={rt.text}
                  facets={rt.facets}
                  truncate={false}
                  disableLinks
                  selectable={false}
                  uiTextView={false}
                />
              </TextInput>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  return (
    <>
      <StatusBar modal />
      <QueryWithoutData query={self} />
    </>
  );
}

async function getImage(i18n: I18n, aspect: [number, number], circle = false) {
  if (!(await getGalleryPermission(i18n))) return;
  const response = await openPicker({
    height: aspect[0] * 1000,
    width: aspect[1] * 1000,
    cropping: true,
    cropperCircleOverlay: circle,
    forceJpg: true,
  });

  return response as CroppedImage;
}
