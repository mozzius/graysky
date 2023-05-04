import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { Copy, CopyCheck } from "lucide-react-native";

import { useAuthedAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";

export interface InviteCodesRef {
  open: () => void;
}

export const InviteCodes = forwardRef<InviteCodesRef>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { top } = useSafeAreaInsets();
  const agent = useAuthedAgent();

  const codes = useQuery({
    queryKey: ["invite-codes"],
    queryFn: async () => {
      return await agent.com.atproto.server.getAccountInviteCodes({
        includeUsed: true,
      });
    },
  });

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

  return (
    <BottomSheet
      index={-1}
      ref={bottomSheetRef}
      enablePanDownToClose
      snapPoints={[1, "60%", Dimensions.get("window").height - top - 10]}
      backdropComponent={BottomSheetBackdrop}
      onChange={handleSheetChanges}
    >
      <Text className="mt-2 text-center text-xl font-medium">Invite Codes</Text>
      {codes.data ? (
        <View className="mt-4 flex-1 px-4">
          <BottomSheetFlatList
            data={codes.data.data.codes}
            renderItem={({ item }) => (
              <CodeRow
                code={item.code}
                used={!!item.forAccount || item.disabled}
              />
            )}
            keyExtractor={(item) => item.code}
            ItemSeparatorComponent={() => <View className="h-px bg-gray-200" />}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
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
      className="flex-row items-center justify-between py-2"
    >
      <Text
        className={cx(
          "font-mono text-base",
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
