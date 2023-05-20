import { Avatar } from "../../../components/avatar";
import { ComposerProvider } from "../../../components/composer";
import { useDrawer } from "../../../components/drawer-content";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function SubStack() {
  const openDrawer = useDrawer();
  return (
    <ComposerProvider>
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="skyline"
          options={{
            title: "Skyline",
            headerLeft: () => (
              <TouchableOpacity onPress={openDrawer}>
                <Avatar size="small" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: "Search",
            headerLeft: () => (
              <TouchableOpacity onPress={openDrawer}>
                <Avatar size="small" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            title: "Notifications",
            headerLeft: () => (
              <TouchableOpacity onPress={openDrawer}>
                <Avatar size="small" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="self" />
      </Stack>
    </ComposerProvider>
  );
}
