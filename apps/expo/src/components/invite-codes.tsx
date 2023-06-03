import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react-native";

import { useAuthedAgent } from "../lib/agent";
import { useBottomSheetStyles } from "../lib/bottom-sheet";
import { cx } from "../lib/utils/cx";

// import { useUserRefresh } from "../lib/utils/query";

export interface InviteCodesRef {
  open: () => void;
}

const InviteCodesSheet = forwardRef<InviteCodesRef>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { top } = useSafeAreaInsets();

  const codes = useInviteCodes();

  useImperativeHandle(ref, () => ({
    open: () => {
      void codes.refetch();
      bottomSheetRef.current?.snapToIndex(1);
    },
  }));

  const handleSheetChanges = useCallback((index: number) => {
    if (index === 0) {
      bottomSheetRef.current?.close();
    }
  }, []);

  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    contentContainerStyle,
  } = useBottomSheetStyles();

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
      backgroundStyle={backgroundStyle}
    >
      <BottomSheetView style={[{ flex: 1 }, contentContainerStyle]}>
        <Text className="mt-2 text-center text-xl font-medium dark:text-white">
          Invite Codes
        </Text>
        {codes.data ? (
          <View className="mt-4 flex-1 dark:bg-black">
            <BottomSheetFlatList
              style={contentContainerStyle}
              data={[...codes.data.unused, ...codes.data.used]}
              renderItem={({ item }) => (
                <CodeRow
                  code={item.code}
                  used={item.uses.length >= item.available}
                />
              )}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => (
                <View className="mx-8 h-px bg-neutral-200 dark:bg-neutral-600" />
              )}
              ListFooterComponent={() => <View className="h-10" />}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-center text-gray-500">
                    No invite codes yet :(
                  </Text>
                </View>
              )}
              // refreshing={refreshing}
              // onRefresh={() => void handleRefresh()}
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
InviteCodesSheet.displayName = "InviteCodes";

export const InviteCodes = memo(InviteCodesSheet);

const CodeRow = ({ code, used }: { code: string; used: boolean }) => {
  const [copied, setCopied] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => {
        void Clipboard.setStringAsync(code);
        setCopied(true);
      }}
      className="flex-row items-center justify-between px-8 py-2"
    >
      <Text
        className={cx(
          "text-base dark:text-white",
          used && "text-neutral-400 line-through",
        )}
      >
        {code}
      </Text>
      {copied ? (
        <Check size={16} color="#888888" />
      ) : (
        !used && <Copy size={16} color="#888888" />
      )}
    </TouchableOpacity>
  );
};

export const useInviteCodes = () => {
  const agent = useAuthedAgent();

  return useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      const codes = await agent.com.atproto.server.getAccountInviteCodes({
        includeUsed: true,
      });
      if (!codes.success) throw new Error("Could not get invite codes");
      return {
        used: codes.data.codes.filter((x) => x.uses.length >= x.available),
        unused: codes.data.codes.filter((x) => x.uses.length < x.available),
      };
    },
  });
};
