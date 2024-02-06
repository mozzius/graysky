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
import { useMutation } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";

import {
  HandleAvailabilityResult,
  useHandleAvailability,
} from "~/components/handle-availability";
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
  // const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const { colorScheme } = useColorScheme();
  const router = useRouter();

  const derivedHandle = `${handle.trim()}.bsky.social`;

  const sendText = useMutation({
    mutationKey: ["send-text"],
    mutationFn: async () => {
      await agent.com.atproto.temp.requestPhoneVerification({
        phoneNumber: phone,
      });
    },
  });

  const resolveHandle = useHandleAvailability(derivedHandle);

  const createAccount = useMutation({
    mutationKey: ["create-account"],
    mutationFn: async () => {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      await agent.createAccount({
        email,
        password,
        handle: derivedHandle,
        verificationPhone: phone,
        verificationCode: phoneCode,
      });
    },
    onSuccess: () => router.replace("/(feeds)/feeds"),
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
    // case 1:
    //   return (
    //     <TransparentHeaderUntilScrolled>
    //       <ScrollView
    //         className="flex-1 px-4"
    //         contentInsetAdjustmentBehavior="automatic"
    //       >
    //         <Stack.Screen
    //           options={{
    //             headerRight: () => <Text className="text-base">1 of 4</Text>,
    //           }}
    //         />
    //         <View className="mt-4 flex-1">
    //           <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
    //             Invite code
    //           </Text>
    //           <View
    //             style={{ backgroundColor: theme.colors.card }}
    //             className="flex-1 overflow-hidden rounded-lg"
    //           >
    //             <TextInput
    //               value={code}
    //               placeholder="Bluesky is currently invite-only"
    //               autoComplete="off"
    //               autoCapitalize="none"
    //               onChange={(evt) => setCode(evt.nativeEvent.text)}
    //               className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
    //               autoFocus
    //             />
    //           </View>
    //         </View>
    //         <Text className="mx-4 mt-3 text-sm text-neutral-500">
    //           Don{"'"}t have one?{" "}
    //           <Text primary onPress={() => router.push("/waitlist")}>
    //             Join the waitlist.
    //           </Text>
    //         </Text>
    //         <View className="flex-row items-center justify-end pt-2">
    //           <TextButton
    //             disabled={!code.trim()}
    //             onPress={() => setStage(2)}
    //             title="Next"
    //             className="font-medium"
    //           />
    //         </View>
    //       </ScrollView>
    //     </TransparentHeaderUntilScrolled>
    //   );
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
                className="overflow-hidden rounded-lg"
              >
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 px-4 py-3"
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
            <View className="flex-row items-center justify-end pt-2">
              <TextButton
                disabled={!email || !password || !dob || getAge(dob) < 18}
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
            {!sendText.isSuccess ? (
              <View className="mt-4 flex-1">
                <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                  Phone number
                </Text>
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 overflow-hidden rounded-lg"
                >
                  <TextInput
                    value={phone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    onChange={(evt) => setPhone(evt.nativeEvent.text)}
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                    autoFocus
                  />
                </View>
                {sendText.isError ? (
                  <Text className="mx-4 mt-3 text-sm text-red-500">
                    {sendText.error.message}
                  </Text>
                ) : (
                  <Text className="mx-4 mt-3 text-sm text-neutral-500">
                    Please enter a phone number that can receive SMS text
                    messages.
                  </Text>
                )}
                <View className="flex-row items-center justify-between pt-4">
                  <TextButton onPress={() => setStage(1)} title="Back" />
                  <TextButton
                    disabled={!phone.trim() || sendText.isPending}
                    onPress={() => sendText.mutate()}
                    title="Request code"
                    className="font-medium"
                  />
                </View>
              </View>
            ) : (
              <View className="mt-4 flex-1">
                <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                  Verification code
                </Text>
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 overflow-hidden rounded-lg"
                >
                  <TextInput
                    value={phoneCode}
                    placeholder="XXXXXX"
                    autoComplete="one-time-code"
                    onChange={(evt) => setPhoneCode(evt.nativeEvent.text)}
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                    autoFocus
                  />
                </View>
                <Text className="mx-4 mt-3 text-sm text-neutral-500">
                  A code has been sent to {phone}.{" "}
                  <Text onPress={() => sendText.reset()} primary>
                    Change phone number.
                  </Text>
                </Text>
                <View className="flex-row items-center justify-between pt-4">
                  <TextButton onPress={() => setStage(1)} title="Back" />
                  <TextButton
                    disabled={phoneCode.trim().length !== 6}
                    onPress={() => setStage(3)}
                    title="Next"
                    className="font-medium"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case 3:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
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
                  onChange={(evt) =>
                    setHandle(evt.nativeEvent.text.toLocaleLowerCase())
                  }
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
                  <HandleAvailabilityResult
                    query={resolveHandle}
                    handle={derivedHandle}
                  />
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
