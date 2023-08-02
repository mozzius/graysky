import {
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@react-navigation/native";

interface Props {
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  title: String;
  style?: StyleProp<ViewStyle>;
}

export const TextButton = ({ disabled, onPress, title, style }: Props) => {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} hitSlop={8}>
      <Text
        className="text-lg"
        style={[
          {
            color: disabled ? theme.colors.border : theme.colors.primary,
          },
          style,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};
