import { View } from "react-native";

export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
};

export function ProgressBar({ value, max, className = "" }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <View className={`h-3 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <View className="h-full rounded-full bg-path" style={{ width: `${pct}%` }} />
    </View>
  );
}
