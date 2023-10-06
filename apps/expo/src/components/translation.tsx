/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import {
  AlertTriangleIcon,
  LanguagesIcon,
  SparklesIcon,
} from "lucide-react-native";
import { z } from "zod";

import { useHaptics } from "~/lib/hooks/preferences";
import { locale } from "~/lib/locale";
import { api } from "~/lib/utils/api";
import { RichTextWithoutFacets } from "./rich-text";
import { Text } from "./text";

interface Props {
  text: string;
  uri: string;
}

export const Translation = ({ text, uri }: Props) => {
  const haptics = useHaptics();
  const translate = api.translate.post.useMutation({
    onMutate: () => haptics.impact(),
  });
  const theme = useTheme();

  useEffect(() => {
    translate.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  try {
    if (text.length < 2 || z.string().emoji().safeParse(text).success) {
      return null;
    }
  } catch (err) {
    console.log(err);
  }

  switch (translate.status) {
    case "idle":
      return (
        <TouchableOpacity
          className="my-1"
          onPress={() =>
            translate.mutate({ text, uri, target: locale.languageCode })
          }
        >
          <View className="flex-row items-center">
            <SparklesIcon
              className="mr-1.5"
              size={16}
              color={theme.colors.primary}
            />
            <Text className="text-base" style={{ color: theme.colors.primary }}>
              Translate post
            </Text>
          </View>
        </TouchableOpacity>
      );
    case "loading":
      return (
        <View className="mt-1.5 h-12 w-full items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    case "success":
      return (
        <View className="mt-1.5 flex-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 dark:border-blue-700 dark:bg-blue-950">
          <Text className="text-base">
            <RichTextWithoutFacets text={translate.data.text} />
          </Text>
          <View className="mt-1 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LanguagesIcon
                size={14}
                className="mr-1 text-neutral-500 dark:text-neutral-200"
              />
              <Text className="text-sm text-neutral-500 dark:text-neutral-200">
                {translate.data.language}
              </Text>
            </View>
            <Image
              source={
                theme.dark
                  ? require("../../assets/translated_by-white.png")
                  : require("../../assets/translated_by.png")
              }
              alt="Translated by Google"
              style={{ aspectRatio: 7.6 }}
              className="w-28 max-w-full"
            />
          </View>
        </View>
      );
    case "error":
      return (
        <TouchableOpacity
          className="mt-0.5"
          onPress={() =>
            translate.mutate({ text, uri, target: locale.languageCode })
          }
        >
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
              An error occurred - try again?
            </Text>
          </View>
        </TouchableOpacity>
      );
  }
};
