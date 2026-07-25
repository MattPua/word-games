import { Text, View } from "react-native";

export type ScoreBubbleProps = {
  word: string;
  hint?: string;
  /** Points for current word (length − 2); shown as badge when > 0. */
  points?: number;
  className?: string;
};

/** Sage word pill + potato score badge — tactile play chrome. */
export function ScoreBubble({
  word,
  hint = "Swipe letters",
  points = 0,
  className = "",
}: ScoreBubbleProps) {
  const show = word.trim().length > 0;
  return (
    <View className={`relative items-center justify-center ${className}`}>
      <View
        className={`cp-word-pill w-full max-w-sm ${show ? "" : "cp-word-pill-empty"}`}
      >
        <Text
          className={`text-center font-display tracking-[0.12em] ${
            show
              ? "text-3xl font-bold text-primary-foreground"
              : "font-body text-base font-medium tracking-normal text-muted-foreground"
          }`}
        >
          {show ? word : hint}
        </Text>
      </View>
      {show && points > 0 ? (
        <View className="cp-score-badge" accessibilityLabel={`${points} points`}>
          <Text className="font-display text-sm font-bold text-foreground">
            {points}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
