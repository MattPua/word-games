import { View } from "react-native";

export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
};

export function ProgressBar({ value, max, className = "" }: ProgressBarProps) {
  /** `value` = remaining to clear; bar empties toward 0 (or fills cleared fraction). */
  const cleared = max <= 0 ? 100 : Math.min(100, Math.round(((max - value) / max) * 100));
  return (
    <View className={`h-3 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <View
        className="h-full rounded-full bg-path transition-[width] duration-300 ease-out"
        style={{ width: `${cleared}%` }}
      />
    </View>
  );
}
