import { Text, View } from "react-native";
import {
  groupWordsByLength,
  type WordLengthGroup,
} from "@couch-potato/game-engine";

function lengthLabel(n: number) {
  return n === 1 ? "1-letter crumbs" : `${n}-letter haul`;
}

/** Length sections (longest first); words A→Z inside each — uses engine grouping. */
export function WordGroups({
  words,
  className = "",
}: {
  words: string[];
  className?: string;
}) {
  const groups = groupWordsByLength(words);
  if (groups.length === 0) return null;
  return (
    <View className={className}>
      {groups.map((g) => (
        <WordLengthSection key={g.length} group={g} />
      ))}
    </View>
  );
}

function WordLengthSection({ group }: { group: WordLengthGroup }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 font-display text-sm text-primary">
        {lengthLabel(group.length)}
      </Text>
      <Text className="font-body text-muted-foreground">
        {group.words.join(", ")}
      </Text>
    </View>
  );
}
