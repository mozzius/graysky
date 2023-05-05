import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { Copy, CopyCheck } from "lucide-react-native";

import { useAuthedAgent } from "../lib/agent";
import { useBottomSheetStyles } from "../lib/bottom-sheet";
import { cx } from "../lib/utils/cx";
import { useUserRefresh } from "../lib/utils/query";

export interface InviteCodesRef {
  open: () => void;
}

export const InviteCodes = forwardRef<InviteCodesRef>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { top } = useSafeAreaInsets();

  const codes = useInviteCodes();

  useImperativeHandle(ref, () => ({
    open: () => {
      void codes.refetch();
      bottomSheetRef.current?.snapToIndex(1);
    },
  }));

  const handleSheetChanges = (index: number) => {
    if (index === 0) {
      bottomSheetRef.current?.close();
    }
  };

  const { refreshing, handleRefresh } = useUserRefresh(codes.refetch);

  const { handleStyle, handleIndicatorStyle, contentContainerStyle } =
    useBottomSheetStyles();

  return (
    <BottomSheet
      index={-1}
      ref={bottomSheetRef}
      enablePanDownToClose
      snapPoints={[1, "60%", Dimensions.get("window").height - top - 10]}
      backdropComponent={BottomSheetBackdrop}
      onChange={handleSheetChanges}
      handleIndicatorStyle={handleIndicatorStyle}
      handleStyle={handleStyle}
    >
      <BottomSheetView style={[{ flex: 1 }, contentContainerStyle]}>
        <Text className="mt-2 text-center text-xl font-medium dark:text-neutral-50">
          Invite Codes
        </Text>
        {codes.data ? (
          <View className="mt-4 flex-1 dark:bg-black">
            <BottomSheetFlatList
              style={contentContainerStyle}
              data={codes.data.data.codes.sort((x) =>
                x.uses.length >= x.available ? 1 : -1,
              )}
              renderItem={({ item }) => (
                <CodeRow
                  code={item.code}
                  used={item.uses.length >= item.available}
                />
              )}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => (
                <View className="mx-8 h-px bg-gray-200" />
              )}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-center text-gray-500">
                    No invite codes yet :(
                  </Text>
                </View>
              )}
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});
InviteCodes.displayName = "InviteCodes";

function CodeRow({ code, used }: { code: string; used: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => {
        void Clipboard.setStringAsync(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }}
      className="flex-row items-center justify-between px-8 py-2"
    >
      <Text
        className={cx(
          "text-base dark:text-neutral-50",
          used && "text-neutral-400 line-through",
        )}
      >
        {code}
      </Text>
      {copied ? (
        <CopyCheck size={16} color="#888888" />
      ) : (
        !used && <Copy size={16} color="#888888" />
      )}
    </TouchableOpacity>
  );
}

export const useInviteCodes = () => {
  const agent = useAuthedAgent();

  return useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      return await agent.com.atproto.server.getAccountInviteCodes({
        includeUsed: true,
      });
    },
  });
};
