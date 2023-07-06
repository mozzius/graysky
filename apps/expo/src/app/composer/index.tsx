import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { RichTextWithoutFacets } from "../../components/rich-text";

export default function ComposerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [content, setContent] = useState("");

  const hasContent = content.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("../")}>
              <Text style={{ color: theme.colors.primary }} className="text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row">
              {!hasContent && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                  <TouchableOpacity
                    onPress={() => router.push("/composer/drafts")}
                    className="mr-6"
                  >
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="text-lg"
                    >
                      Drafts
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
              <TouchableOpacity onPress={() => router.push("../")}>
                <Text
                  style={{ color: theme.colors.primary }}
                  className="text-lg font-medium"
                  disabled={!hasContent}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <TextInput onChange={(evt) => setContent(evt.nativeEvent.text)} multiline>
        <RichTextWithoutFacets text={content} truncate={false} />
      </TextInput>
    </View>
  );
}
