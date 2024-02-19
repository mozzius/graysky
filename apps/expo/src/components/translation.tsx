/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useCallback, useEffect } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import {
  AlertTriangleIcon,
  LanguagesIcon,
  SparklesIcon,
} from "lucide-react-native";

import { useHaptics } from "~/lib/hooks/preferences";
import { useIsPro } from "~/lib/purchases";
import {
  usePrimaryLanguage,
  useTranslationMethod,
} from "~/lib/storage/app-preferences";
import { api } from "~/lib/utils/api";
import { cx } from "~/lib/utils/cx";
import { RichTextWithoutFacets } from "./rich-text";
import { Text } from "./themed/text";

interface Props {
  text: string;
  uri: string;
  forceShow?: boolean;
}

export const Translation = ({ text, uri, forceShow }: Props) => {
  const primaryLanguage = usePrimaryLanguage();
  const translationMethod = useTranslationMethod();
  const isPro = useIsPro();
  const haptics = useHaptics();
  const translate = api.translate.post.useMutation({
    onMutate: () => haptics.impact(),
  });
  const theme = useTheme();
  const { _ } = useLingui();

  const service = isPro ? translationMethod : "GOOGLE";

  const { mutate, reset, isIdle } = translate;

  const trigger = useCallback(() => {
    if (isIdle) {
      mutate({ text, uri, target: primaryLanguage, service });
    }
  }, [mutate, isIdle, text, uri, primaryLanguage, service]);

  useEffect(() => {
    if (forceShow) {
      setTimeout(() => {
        trigger();
      });
    }
  }, [forceShow, trigger]);

  useEffect(() => {
    reset();
  }, [uri, reset]);

  useEffect(() => {
    if (translate.error) {
      Sentry.captureException(translate.error);
    }
  }, [translate.error]);

  if (text.length < 2) {
    return null;
  }

  switch (translate.status) {
    case "idle":
      return (
        <TouchableOpacity className="my-1" onPress={() => trigger()}>
          <View className="flex-row items-center">
            <SparklesIcon
              className="mr-1.5"
              size={16}
              color={theme.colors.primary}
            />
            <Text className="text-base" primary>
              <Trans>Translate post</Trans>
            </Text>
          </View>
        </TouchableOpacity>
      );
    case "pending":
      return (
        <View className="mt-1.5 h-12 w-full items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    case "success":
      return (
        <View
          className={cx(
            "mt-1.5 flex-1 rounded-lg border px-3 py-2",
            theme.dark
              ? "border-blue-700 bg-blue-950"
              : "border-blue-300 bg-blue-50",
          )}
        >
          <Text className="text-base">
            <RichTextWithoutFacets text={translate.data.text} />
          </Text>
          <View className="mt-1 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LanguagesIcon
                size={14}
                className={cx(
                  "mr-1",
                  theme.dark ? "text-neutral-200" : "text-neutral-500",
                )}
              />
              <Text
                className={cx(
                  "text-sm",
                  theme.dark ? "text-neutral-200" : "text-neutral-500",
                )}
              >
                {translate.data.language}
              </Text>
            </View>
            {service === "GOOGLE" ? (
              <Image
                source={
                  theme.dark
                    ? require("../../assets/translated_by-white.png")
                    : require("../../assets/translated_by.png")
                }
                alt={_(msg`Translated by Google`)}
                style={{ aspectRatio: 7.6 }}
                className="w-28 max-w-full"
              />
            ) : (
              <Text
                className={cx(
                  "text-right text-sm",
                  theme.dark ? "text-neutral-200" : "text-neutral-500",
                )}
              >
                <Trans>Translated by DeepL</Trans>
              </Text>
            )}
          </View>
        </View>
      );
    case "error":
      return (
        <TouchableOpacity className="mt-0.5" onPress={() => trigger()}>
          <View className="flex-row items-center">
            <AlertTriangleIcon
              className="mr-1.5"
              size={16}
              color={theme.colors.notification}
            />
            <Text
              style={{ color: theme.colors.notification }}
              className="text-base"
            >
              <Trans>An error occurred</Trans>
            </Text>
          </View>
        </TouchableOpacity>
      );
  }
};
