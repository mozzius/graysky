import { Redirect, useLocalSearchParams } from "expo-router";

export default function ProfileRedirect() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <Redirect href={`/profile/${handle}/posts`} />;
}
