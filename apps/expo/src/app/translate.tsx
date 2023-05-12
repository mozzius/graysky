import { Button } from "react-native";
import WebView from "react-native-webview";
import { Stack, useNavigation, useRouter, useSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyledComponent } from "nativewind";

import { locale } from "../lib/locale";

export default function Translate() {
  const { text } = useSearchParams() as { text: string };
  const router = useRouter();
  const navigation = useNavigation();
  return (
    <>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              title="Dismiss"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  router.push("/skyline");
                }
              }}
            />
          ),
        }}
      />
      <StyledComponent
        component={WebView}
        source={{
          uri: `https://translate.google.com/?sl=auto&tl=${locale.languageCode}&text=${text}&op=translate`,
        }}
        style={{ flex: 1 }}
      />
    </>
  );
}
