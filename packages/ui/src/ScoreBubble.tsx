import { Text, View } from "react-native";

export type ScoreBubbleProps = {
  word: string;
  className?: string;
};

export function ScoreBubble({ word, className = "" }: ScoreBubbleProps) {
  return (
    <View
      className={`min-h-12 items-center justify-center rounded-ui bg-secondary px-4 py-2 ${className}`}
    >
      <Text className="font-display text-xl font-semibold tracking-widest text-foreground">
        {word || " "}
      </Text>
    </View>
  );
}
