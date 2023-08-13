import WebView from "react-native-webview";
import { useLocalSearchParams } from "expo-router";

import { StatusBar } from "../components/status-bar";
import { locale } from "../lib/locale";

export default function Translate() {
  const { text } = useLocalSearchParams() as { text: string };

  return (
    <>
      <StatusBar modal />
      <WebView
        className="flex-1"
        source={{
          uri: `https://translate.google.com/?sl=auto&tl=${locale.languageCode}&text=${text}&op=translate`,
        }}
      />
    </>
  );
}
