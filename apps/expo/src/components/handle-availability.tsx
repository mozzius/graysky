import { ActivityIndicator, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, SmileIcon, XCircleIcon } from "lucide-react-native";

import { useAgent } from "~/lib/agent";
import { Text } from "./themed/text";

export const useHandleAvailability = (handle: string) => {
  const agent = useAgent();
  return useQuery({
    enabled: handle.length >= 3,
    queryKey: ["resolve-handle", handle],
    queryFn: async (): Promise<"available" | "taken" | "invalid"> => {
      try {
        // weird ones that are invalid but don't return as such
        if (["test.bsky.social", "bsky.bsky.social"].includes(handle))
          return "invalid";
        await agent.resolveHandle({ handle });
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
};

export const HandleAvailabilityResult = ({
  query,
  handle,
  success,
}: {
  query: ReturnType<typeof useHandleAvailability>;
  handle: string;
  success?: boolean;
}) => {
  if (query.isPending && handle.length >= 3) {
    return <ActivityIndicator />;
  } else if (success) {
    return (
      <View className="flex-row items-center">
        <SmileIcon className="mr-1.5 text-green-700" size={14} />
        <Text className="text-sm text-green-700">That{"'"}s you!</Text>
      </View>
    );
  } else if (query.data) {
    switch (query.data) {
      case "available":
        return (
          <View className="flex-row items-center">
            <CheckCircle2Icon className="mr-1.5 text-green-700" size={14} />
            <Text className="text-sm text-green-700">Available</Text>
          </View>
        );
      case "taken":
        return (
          <View className="flex-row items-center">
            <XCircleIcon className="mr-1.5 text-red-500" size={14} />
            <Text className="text-sm text-red-500">Handle is taken</Text>
          </View>
        );
      case "invalid":
        return (
          <View className="flex-row items-center">
            <XCircleIcon className="mr-1.5 text-red-500" size={14} />
            <Text className="text-sm text-red-500">Handle is invalid</Text>
          </View>
        );
    }
  }
};
