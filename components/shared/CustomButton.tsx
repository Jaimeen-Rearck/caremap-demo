import palette from "@/utils/theme/color";
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type ButtonProps = {
  title: React.ReactNode; // allows string OR JSX
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  activeOpacity?: number;
};

export function CustomButton({
  title,
  onPress,
  disabled = false,
  className,
  activeOpacity = 0.75,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={{
        backgroundColor: palette.primary,
        opacity: disabled ? 0.5 : 1,
      }}
      className={`py-[10px] rounded-xl ${className ?? ""}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white font-semibold text-center text-lg">
        {title}
      </Text>
    </TouchableOpacity>
  );
}
