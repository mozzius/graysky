import { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { AlertTriangle, Languages, Sparkles } from "lucide-react-native";

import { locale } from "../lib/locale";
import { api } from "../lib/utils/api";
import { RichTextWithoutFacets } from "./rich-text";

interface Props {
  text: string;
  uri: string;
}

export const Translation = ({ text, uri }: Props) => {
  const translate = api.translate.post.useMutation();
  const theme = useTheme();

  useEffect(() => {
    translate.reset();
  }, [uri]);

  switch (translate.status) {
    case "idle":
      return (
        <TouchableOpacity
          className="mt-0.5"
          onPress={() =>
            translate.mutate({ text, uri, target: locale.languageCode })
          }
        >
          <View className="flex-row items-center bg-white dark:bg-black">
            <Sparkles className="mr-2" size={18} color={theme.colors.primary} />
            <Text
              style={{ color: theme.colors.primary }}
              className="text-base font-medium"
            >
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
        <View className="mt-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 dark:border-blue-700 dark:bg-blue-950">
          <Text style={{ color: theme.colors.text }} className="text-base">
            {translate.data.text}
          </Text>
          <View className="mt-1 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Languages
                size={14}
                className="mr-1 text-neutral-500 dark:text-neutral-200"
              />
              <Text className="text-sm text-neutral-500 dark:text-neutral-200">
                <RichTextWithoutFacets text={translate.data.language} />
              </Text>
            </View>
            <Image
              source={
                theme.dark
                  ? require("../../assets/translated_by-white.png")
                  : require("../../assets/translated_by.png")
              }
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
          <View className="flex-row items-center bg-white dark:bg-black">
            <AlertTriangle
              className="mr-2"
              size={18}
              color={theme.colors.notification}
            />
            <Text
              style={{ color: theme.colors.notification }}
              className="text-base font-semibold"
            >
              An error occurred - try again?
            </Text>
          </View>
        </TouchableOpacity>
      );
  }
};
