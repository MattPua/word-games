import { Pressable, Text, View } from "react-native";
import { groupWordsByLength, type WordLengthGroup } from "@couch-potato/game-engine";

function lengthLabel(n: number) {
  return n === 1 ? "1-letter crumbs" : `${n}-letter haul`;
}

function titleCase(w: string) {
  return w.length ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w;
}

export type WordGroupsVariant = "found" | "missed";

/**
 * Length sections (longest first); words A→Z inside each — uses engine grouping.
 * Renders as tactile chips (not a comma wall); `found` gets a sage tint + catch-in
 * bounce, `missed` stays muted/quiet — see `.cursor/rules/ui.mdc` results one-liner.
 * Optional `onWordSelect` makes chips toggles for Results board replay.
 */
export function WordGroups({
  words,
  variant = "found",
  className = "",
  selectedWord,
  onWordSelect,
}: {
  words: string[];
  variant?: WordGroupsVariant;
  className?: string;
  selectedWord?: string | null;
  onWordSelect?: (word: string) => void;
}) {
  const groups = groupWordsByLength(words);
  if (groups.length === 0) return null;
  return (
    <View className={`${variant === "found" ? "cp-catch-in" : ""} ${className}`}>
      {groups.map((g) => (
        <WordLengthSection
          key={g.length}
          group={g}
          variant={variant}
          selectedWord={selectedWord}
          onWordSelect={onWordSelect}
        />
      ))}
    </View>
  );
}

function WordLengthSection({
  group,
  variant,
  selectedWord,
  onWordSelect,
}: {
  group: WordLengthGroup;
  variant: WordGroupsVariant;
  selectedWord?: string | null;
  onWordSelect?: (word: string) => void;
}) {
  return (
    <View className="mb-3 last:mb-0">
      <Text
        className={`mb-1.5 font-display text-xs font-bold uppercase tracking-[0.1em] ${
          variant === "found" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {lengthLabel(group.length)}
      </Text>
      {/* Full literal class names below (not `cp-word-chip-${variant}`) — Tailwind's
          content scanner purges `@layer components` rules whose exact class string
          never appears verbatim in source, so a template-interpolated suffix silently
          drops the rule. See `.cursor/rules/ui.mdc`. */}
      <View className="flex-row flex-wrap gap-1.5">
        {group.words.map((w) => {
          const selected = selectedWord?.toLowerCase() === w.toLowerCase();
          const chipClass = [
            "cp-word-chip",
            variant === "found" ? "cp-word-chip-found" : "cp-word-chip-missed",
            selected ? "cp-word-chip-selected" : "",
            onWordSelect ? "cp-word-chip-interactive" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const label = titleCase(w);
          if (!onWordSelect) {
            return (
              <View key={w} className={chipClass}>
                <Text className="font-body text-sm font-semibold text-foreground">{label}</Text>
              </View>
            );
          }
          return (
            <Pressable
              key={w}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={
                selected ? `${label}, showing path on board` : `Show ${label} on the board`
              }
              onPress={() => onWordSelect(w)}
              className={chipClass}
            >
              <Text className="font-body text-sm font-semibold text-foreground">{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
