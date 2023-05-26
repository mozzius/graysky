import { View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { CheckCircle, PlusCircle } from "lucide-react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  image?: string;
  children?: React.ReactNode;
  className?: string;
  bookmarked?: boolean;
  toggleBookmark?: () => void;
}

export const GeneratorRow = ({
  children,
  className,
  image,
  bookmarked,
  toggleBookmark,
}: Props) => {
  return (
    <View
      className={cx(
        (className =
          "w-full flex-row items-center border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black"),
        className,
      )}
    >
      <Image
        source={{ uri: image }}
        className="h-10 w-10 rounded border border-neutral-200 dark:border-neutral-700"
      />
      <View className="mx-4 flex-1">{children}</View>
      <TouchableOpacity onPress={toggleBookmark}>
        {bookmarked ? (
          <CheckCircle size={20} className="text-black dark:text-white" />
        ) : (
          <PlusCircle size={20} className="text-black dark:text-white" />
        )}
      </TouchableOpacity>
    </View>
  );
};
