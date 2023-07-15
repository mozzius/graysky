import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ContextMenuButton } from "react-native-ios-context-menu";
import * as ImagePicker from "expo-image-picker";
import {
  Link,
  Stack,
  useFocusEffect,
  useNavigation,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RichText as RichTextHelper, type BskyAgent } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react-native";

import { Avatar } from "../../components/avatar";
import { RichText } from "../../components/rich-text";
import { useAuthedAgent } from "../../lib/agent";
import { cx } from "../../lib/utils/cx";

// text
const MAX_LENGTH = 300;

// images
const MAX_IMAGES = 4;
const MAX_SIZE = 1_000_000;
const MAX_DIMENSION = 2048;

const generateRichText = async (text: string, agent: BskyAgent) => {
  const rt = new RichTextHelper({ text });
  await rt.detectFacets(agent);
  return rt;
};

export default function ComposerScreen() {
  const theme = useTheme();
  const agent = useAuthedAgent();
  const navigation = useNavigation();

  const [text, setText] = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const textRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        textRef.current?.focus();
      }, 100);
    }, []),
  );

  const rt = useQuery({
    queryKey: ["rt", text],
    queryFn: async () => {
      return await generateRichText(text, agent);
    },
    keepPreviousData: true,
  });

  const tooLong = (rt.data?.graphemeLength ?? 0) > MAX_LENGTH;

  const isEmpty = text.trim().length === 0 && images.length === 0;

  useEffect(() => {
    navigation.getParent()?.setOptions({ gestureEnabled: isEmpty });
  }, [navigation, isEmpty]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <CancelButton
              hasContent={!isEmpty}
              onSave={() => Alert.alert("Not yet implemented")}
            />
          ),

          headerRight: () => <PostButton disabled={isEmpty} />,
        }}
      />
      <ScrollView>
        <View className="w-full flex-row px-2 pt-4">
          <View className="shrink-0 px-2">
            <Avatar />
          </View>
          <View className="min-h-[48px] flex-1 flex-row items-center px-2">
            <TextInput
              ref={textRef}
              onChange={(evt) => setText(evt.nativeEvent.text)}
              multiline
              className="w-full text-lg leading-5"
              placeholder="What's on your mind?"
              placeholderTextColor={theme.dark ? "#555" : "#aaa"}
              verticalAlign="middle"
              textAlignVertical="center"
            >
              <RichText
                size="lg"
                text={rt.data?.text ?? text}
                facets={rt.data?.facets}
                truncate={false}
                disableLinks
              />
            </TextInput>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}

const PostButton = ({ disabled }: { disabled: boolean }) => {
  const theme = useTheme();

  return (
    <View className="flex-row items-center">
      <Link href="../" asChild>
        <TouchableOpacity disabled={disabled}>
          <View
            className={cx(
              "flex-row items-center rounded-full px-4 py-1",
              disabled && "opacity-50",
            )}
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="mr-2 text-base font-medium text-white dark:text-black">
              Post
            </Text>
            <Send size={12} className="text-white dark:text-black" />
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const CancelButton = ({
  hasContent,
  onSave,
}: {
  hasContent: boolean;
  onSave: () => void;
}) => {
  const theme = useTheme();
  const router = useRouter();

  if (hasContent) {
    return (
      <ContextMenuButton
        isMenuPrimaryAction={true}
        accessibilityLabel="Save or discard post"
        accessibilityRole="button"
        menuConfig={{
          menuTitle: "",
          menuItems: [
            {
              actionKey: "save",
              actionTitle: "Save to drafts",
              icon: {
                type: "IMAGE_SYSTEM",
                imageValue: {
                  systemName: "square.and.arrow.down",
                },
              },
            },
            {
              actionKey: "discard",
              actionTitle: "Discard post",
              icon: {
                type: "IMAGE_SYSTEM",
                imageValue: {
                  systemName: "trash",
                },
              },
              menuAttributes: ["destructive"],
            },
          ],
        }}
        onPressMenuItem={(evt) => {
          switch (evt.nativeEvent.actionKey) {
            case "save":
              onSave();
              break;
            case "discard":
              router.push("../");
              break;
          }
        }}
      >
        <TouchableOpacity>
          <Text style={{ color: theme.colors.primary }} className="text-lg">
            Cancel
          </Text>
        </TouchableOpacity>
      </ContextMenuButton>
    );
  }

  return (
    <Link href="../" asChild>
      <TouchableOpacity>
        <Text style={{ color: theme.colors.primary }} className="text-lg">
          Cancel
        </Text>
      </TouchableOpacity>
    </Link>
  );
};
