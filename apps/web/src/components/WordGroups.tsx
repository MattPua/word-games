import { Text, View } from "react-native";
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
 */
export function WordGroups({
  words,
  variant = "found",
  className = "",
}: {
  words: string[];
  variant?: WordGroupsVariant;
  className?: string;
}) {
  const groups = groupWordsByLength(words);
  if (groups.length === 0) return null;
  return (
    <View className={`${variant === "found" ? "cp-catch-in" : ""} ${className}`}>
      {groups.map((g) => (
        <WordLengthSection key={g.length} group={g} variant={variant} />
      ))}
    </View>
  );
}

function WordLengthSection({
  group,
  variant,
}: {
  group: WordLengthGroup;
  variant: WordGroupsVariant;
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
        {group.words.map((w) => (
          <View
            key={w}
            className={`cp-word-chip ${variant === "found" ? "cp-word-chip-found" : "cp-word-chip-missed"}`}
          >
            <Text className="font-body text-sm font-semibold text-foreground">{titleCase(w)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
