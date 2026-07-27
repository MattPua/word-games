import { Text, View } from "react-native";

export type ScoreBubbleProps = {
  word: string;
  hint?: string;
  className?: string;
  nabPop?: boolean;
  nabLength?: number;
};

/** Sage word pill for the live swipe word — tactile play chrome (no pts badge mid-swipe). */
export function ScoreBubble({
  word,
  hint = "Swipe letters",
  className = "",
  nabPop = false,
  nabLength = 0,
}: ScoreBubbleProps) {
  const show = word.trim().length > 0;
  const heat =
    nabPop && nabLength >= 6
      ? "cp-word-pill-hot"
      : nabPop && nabLength >= 5
        ? "cp-word-pill-warm"
        : "";
  return (
    <View className={`relative items-center justify-center ${className}`}>
      {/* `.cp-word-pill` / `.cp-word-pill-empty` carry the font (display word vs
          body hint) — the Text only needs size/weight/color. */}
      <View
        className={`cp-word-pill w-full max-w-sm ${show ? "" : "cp-word-pill-empty"} ${nabPop ? "cp-word-pill-pop" : ""} ${heat}`}
      >
        <Text
          className={`text-center leading-none tracking-normal ${
            show
              ? "text-3xl font-bold text-primary-foreground"
              : "text-base font-medium text-muted-foreground"
          }`}
        >
          {show ? word : hint}
        </Text>
      </View>
    </View>
  );
}
