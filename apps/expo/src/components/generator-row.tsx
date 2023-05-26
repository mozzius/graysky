import { View } from "react-native";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Image } from "expo-image";
import {
  CheckCircle,
  ChevronRight,
  GripVertical,
  Pin,
} from "lucide-react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  image?: string;
  children?: React.ReactNode;
  className?: string;
  pinned?: boolean;
  togglePinned?: () => void;
  icon?: "pin" | "chevron";
  drag?: () => void;
  isDragging?: boolean;
  border?: boolean;
}

export const GeneratorRow = ({
  children,
  className,
  image,
  pinned,
  togglePinned,
  icon,
  isDragging,
  drag,
  border = true,
}: Props) => {
  return (
    <View
      className={cx(
        "w-full flex-row items-center border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-black",
        border && "border-b",
        !!drag && "pr-4",
        isDragging && "-mt-px border-t",
        className,
      )}
    >
      {drag && (
        <TouchableWithoutFeedback onPressIn={drag}>
          <View className="p-2 pl-1">
            <GripVertical size={20} className="text-black dark:text-white" />
          </View>
        </TouchableWithoutFeedback>
      )}
      <Image
        source={{ uri: image }}
        className="h-9 w-9 rounded border border-neutral-200 dark:border-neutral-700"
      />
      <View className="mx-3 flex-1">{children}</View>
      {icon === "pin" && (
        <TouchableOpacity onPress={togglePinned}>
          {pinned ? (
            <CheckCircle size={20} className="text-black dark:text-white" />
          ) : (
            <Pin size={20} className="text-black dark:text-white" />
          )}
        </TouchableOpacity>
      )}
      {icon === "chevron" && (
        <ChevronRight size={20} className="text-black dark:text-white" />
      )}
    </View>
  );
};
