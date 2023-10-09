import WebView from "react-native-webview";
import { useLocalSearchParams } from "expo-router";

import { StatusBar } from "~/components/status-bar";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function Translate() {
  const { text } = useLocalSearchParams() as { text: string };
  const [{ primaryLanguage }] = useAppPreferences();
  return (
    <>
      <StatusBar modal />
      <WebView
        className="flex-1"
        source={{
          uri: `https://translate.google.com/?sl=auto&tl=${primaryLanguage}&text=${text}&op=translate`,
        }}
      />
    </>
  );
}
