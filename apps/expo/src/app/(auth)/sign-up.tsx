import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableHighlight,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { locale } from "~/lib/locale";

// helper from official app
export function getAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function SignUp() {
  const theme = useTheme();
  const agent = useAgent();

  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [dob, setDob] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [handle, setHandle] = useState<string>("");
  const { colorScheme } = useColorScheme();
  const router = useRouter();

  const derivedHandle = `${handle.trim()}.bsky.social`;

  const resolveHandle = useQuery({
    enabled: handle.length >= 3,
    queryKey: ["resolve-handle", derivedHandle],
    queryFn: async (): Promise<"available" | "taken" | "invalid"> => {
      try {
        await agent.resolveHandle({
          handle: derivedHandle,
        });
        return "taken";
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Unable to resolve handle") return "available";
          else return "invalid";
        } else {
          throw err;
        }
      }
    },
  });

  let handleResult = null;

  if (resolveHandle.isPending && handle.length >= 3) {
    handleResult = <ActivityIndicator />;
  } else if (resolveHandle.data) {
    switch (resolveHandle.data) {
      case "available":
        handleResult = (
          <View className="flex-row items-center">
            <CheckCircle2Icon className="mr-1.5 text-green-700" size={14} />
            <Text className="text-sm text-green-700">Available</Text>
          </View>
        );
        break;
      case "taken":
        handleResult = (
          <View className="flex-row items-center">
            <XCircleIcon className="mr-1.5 text-red-500" size={14} />
            <Text className="text-sm text-red-500">Handle is taken</Text>
          </View>
        );
        break;
      case "invalid":
        handleResult = (
          <View className="flex-row items-center">
            <XCircleIcon className="mr-1.5 text-red-500" size={14} />
            <Text className="text-sm text-red-500">Handle is invalid</Text>
          </View>
        );
        break;
    }
  }

  const createAccount = useMutation({
    mutationKey: ["create-account"],
    mutationFn: async () => {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      await agent.createAccount({
        inviteCode: code.trim(),
        email,
        password,
        handle: derivedHandle,
      });
    },
    onSuccess: () => router.push("../"),
    onError: (err) => {
      console.error(err);
      showToastable({
        title: "Could not create account",
        message: err instanceof Error ? err.message : "Unknown error",
        status: "warning",
      });
    },
  });

  switch (stage) {
    case 1:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <Stack.Screen
              options={{
                headerRight: () => <Text className="text-base">1 of 3</Text>,
              }}
            />
            <View className="mt-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                Invite code
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <TextInput
                  value={code}
                  placeholder="Bluesky is currently invite-only"
                  autoComplete="off"
                  autoCapitalize="none"
                  onChange={(evt) => setCode(evt.nativeEvent.text)}
                  className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                  autoFocus
                />
              </View>
            </View>
            <Text className="mx-4 mt-3 text-sm text-neutral-500">
              Don{"'"}t have one?{" "}
              <Text
                style={{ color: theme.colors.primary }}
                onPress={() => router.push("/waitlist")}
              >
                Join the waitlist.
              </Text>
            </Text>
            <View className="flex-row items-center justify-end pt-2">
              <TextButton
                disabled={!code.trim()}
                onPress={() => setStage(2)}
                title="Next"
                className="font-medium"
              />
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case 2:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <Stack.Screen
              options={{
                headerRight: () => <Text className="text-base">2 of 3</Text>,
              }}
            />
            <View className="my-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                Email
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <TextInput
                  value={email}
                  placeholder="alice@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  onChange={(evt) => setEmail(evt.nativeEvent.text)}
                  className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                />
              </View>
            </View>
            <View className="mb-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                Password
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 overflow-hidden rounded-lg"
                >
                  <TextInput
                    value={password}
                    secureTextEntry
                    onChange={(evt) => setPassword(evt.nativeEvent.text)}
                    placeholder="Must be at least 8 characters"
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                  />
                </View>
              </View>
            </View>
            <View className="mb-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                Date of Birth
              </Text>
              <TouchableHighlight
                onPress={() => setDatePickerOpen(true)}
                className="rounded-lg"
              >
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 overflow-hidden rounded-lg px-4 py-3"
                >
                  <Text
                    className="text-base"
                    style={{
                      color: dob ? theme.colors.text : theme.colors.primary,
                    }}
                  >
                    {dob
                      ? getAge(dob) < 18
                        ? "Unfortunately, you do not meet the requirements to create an account"
                        : new Intl.DateTimeFormat(locale.languageTag, {
                            dateStyle: "long",
                          }).format(new Date(dob))
                      : "Select date of birth"}
                  </Text>
                  <DatePicker
                    modal
                    mode="date"
                    open={datePickerOpen}
                    // 20 year default
                    date={
                      dob ?? new Date(Date.now() - 60e3 * 60 * 24 * 365 * 20)
                    }
                    onConfirm={(date) => {
                      setDatePickerOpen(false);
                      setDob(date);
                    }}
                    onCancel={() => {
                      setDatePickerOpen(false);
                    }}
                    theme={colorScheme}
                  />
                </View>
              </TouchableHighlight>
            </View>
            <View className="flex-row items-center justify-between pt-2">
              <TextButton onPress={() => setStage(1)} title="Back" />
              <TextButton
                disabled={!email || !password || !dob || getAge(dob) < 18}
                onPress={() => setStage(3)}
                title="Next"
                className="font-medium"
              />
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case 3:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView className="flex-1 px-4">
            <Stack.Screen
              options={{
                headerRight: () => <Text className="text-base">3 of 3</Text>,
              }}
            />
            <View className="my-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                Choose a handle
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <TextInput
                  value={handle}
                  placeholder="You can change it later"
                  autoComplete="username"
                  autoCapitalize="none"
                  onChange={(evt) => setHandle(evt.nativeEvent.text)}
                  className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                />
              </View>
              {handle && (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={LinearTransition}
                >
                  <Text className="mx-4 mt-3 text-sm text-neutral-500">
                    Your handle will be:{" "}
                    <Text className="font-bold">@{derivedHandle}</Text>
                  </Text>
                </Animated.View>
              )}
              {handle.length >= 3 && (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={LinearTransition}
                  className="mx-4 mt-2 items-start"
                >
                  {handleResult}
                </Animated.View>
              )}
            </View>
            <Animated.View
              className="flex-row items-center justify-between pt-2"
              layout={LinearTransition}
            >
              <TextButton onPress={() => setStage(2)} title="Back" />
              {!createAccount.isPending ? (
                <TextButton
                  disabled={resolveHandle.data !== "available"}
                  onPress={() => createAccount.mutate()}
                  title="Create Account"
                  className="font-medium"
                />
              ) : (
                <ActivityIndicator className="px-2" />
              )}
            </Animated.View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
  }
}
