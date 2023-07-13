import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { Send } from "lucide-react-native";

import { RichTextWithoutFacets } from "../../components/rich-text";
import { cx } from "../../lib/utils/cx";

export default function ComposerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [content, setContent] = useState("");

  const hasContent = content.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          gestureEnabled: !hasContent,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("../")}>
              <Text style={{ color: theme.colors.primary }} className="text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("../")}
              disabled={!hasContent}
            >
              <View
                className={cx(
                  "flex-row items-center rounded-full px-4 py-1",
                  !hasContent && "opacity-50",
                )}
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Text className="mr-2 text-base font-medium text-white dark:text-black">
                  Post
                </Text>
                <Send size={12} className="text-white dark:text-black" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <TextInput
        onChange={(evt) => setContent(evt.nativeEvent.text)}
        multiline
        className="min-h-full bg-red-500"
        autoFocus
      >
        <RichTextWithoutFacets text={content} truncate={false} />
      </TextInput>
    </View>
  );
}
