import { ScrollView } from "react-native";

import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";

export default function ChangeHandle() {
  return (
    <TransparentHeaderUntilScrolled>
      <ScrollView
        className="flex-1 p-8"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text>
          This feature is coming soon. Please use the official app in the
          meantime.
        </Text>
      </ScrollView>
    </TransparentHeaderUntilScrolled>
  );
}
