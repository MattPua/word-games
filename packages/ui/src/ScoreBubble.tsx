import { Text, View } from "react-native";

export type ScoreBubbleProps = {
  word: string;
  hint?: string;
  className?: string;
};

/** Large in-progress / flash word above the grid. */
export function ScoreBubble({
  word,
  hint = "Swipe letters",
  className = "",
}: ScoreBubbleProps) {
  const show = word.trim().length > 0;
  return (
    <View
      className={`min-h-16 items-center justify-center rounded-ui bg-secondary px-4 py-3 ${className}`}
    >
      <Text
        className={`text-center font-display tracking-[0.2em] ${
          show
            ? "text-3xl font-semibold text-foreground"
            : "text-base font-medium text-muted-foreground"
        }`}
      >
        {show ? word : hint}
      </Text>
    </View>
  );
}
