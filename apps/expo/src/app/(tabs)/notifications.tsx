// import { ActivityIndicator, Text, View } from "react-native";
// import { Stack } from "expo-router";
// import { FlashList } from "@shopify/flash-list";
// import { useInfiniteQuery } from "@tanstack/react-query";

// import { Button } from "../../components/button";
// import { useAuthedAgent } from "../../lib/agent";

// export default function NotificationsPage() {
//   const agent = useAuthedAgent();
//   const notifications = useInfiniteQuery({
//     queryKey: ["notifications"],
//     queryFn: async ({ pageParam }) => {
//       const notifs = await agent.listNotifications({
//         cursor: pageParam as string | undefined,
//       });
//       return notifs.data;
//     },
//     getNextPageParam: (lastPage) => lastPage.cursor,
//   });

//   switch (notifications.status) {
//     case "loading":
//       return (
//         <View className="flex-1 items-center justify-center">
//           <Stack.Screen options={{ headerShown: true }} />
//           <ActivityIndicator />
//         </View>
//       );

//     case "error":
//       return (
//         <View className="flex-1 items-center justify-center p-4">
//           <Stack.Screen options={{ headerShown: true }} />
//           <Text className="text-center text-xl">
//             {(notifications.error as Error).message || "An error occurred"}
//           </Text>
//           <Button
//             variant="outline"
//             onPress={() => void notifications.refetch()}
//           >
//             Retry
//           </Button>
//         </View>
//       );

//     case "success":
//       return (
//         <>
//           <Stack.Screen options={{ headerShown: true }} />
//           <FlashList
//             data={notifications.data.pages.flatMap(
//               (page) => page.notifications,
//             )}
//             renderItem={({ item }) => (
//               <View className="w-full border-b p-4">
//                 <Text>{JSON.stringify(item, null, 2)}</Text>
//               </View>
//             )}
//             onEndReachedThreshold={0.5}
//             onEndReached={() => void notifications.fetchNextPage()}
//             onRefresh={() => {
//               if (!notifications.isRefetching) void notifications.refetch();
//             }}
//             refreshing={notifications.isRefetching}
//             ListFooterComponent={
//               notifications.isFetching ? (
//                 <View className="w-full items-center py-4">
//                   <ActivityIndicator />
//                 </View>
//               ) : null
//             }
//           />
//         </>
//       );
//   }
// }

import { Text, View } from "react-native";

export default function NotificationsPage() {
  return (
    <View className="flex-1 justify-center">
      <Text className="text-center text-xl">Coming soon</Text>
    </View>
  );
}
