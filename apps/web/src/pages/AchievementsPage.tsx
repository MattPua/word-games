import { Text, View } from "react-native";
import { useNavigate } from "@tanstack/react-router";
import { Medal, Sofa } from "lucide-react";
import { Shell } from "@couch-potato/ui";
import { allTrackProgress, withGamesPlayed, type TrackId } from "../achievements";
import { getActiveProfile } from "../storage";
import { AchievementTrackRow } from "@/components/achievementUi";
import { Button } from "@/components/ui/button";

const SECTIONS: { title: string; blurb: string; ids: TrackId[] }[] = [
  {
    title: "The big picture",
    blurb: "Every run pads these out",
    ids: ["points", "words", "sessions"],
  },
  {
    title: "Personal bests",
    blurb: "Your single best run, not the lifetime pile",
    ids: ["bestRunPoints", "bestRunWords"],
  },
  {
    title: "Length hauls",
    blurb: "Counted every time you nab one, repeats and all",
    ids: ["len3", "len4", "len5", "len6", "len7plus"],
  },
  {
    title: "Survival",
    blurb: "Stay alive as long as you can, one word at a time",
    ids: ["survivalTime", "survivalWords"],
  },
];

export function AchievementsPage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  const ctx = withGamesPlayed(profile.achievements, profile.gamesPlayed);
  const progressById = new Map(allTrackProgress(ctx).map((p) => [p.track.id, p]));
  const medalsEarned = [...progressById.values()].reduce((sum, p) => sum + p.stage, 0);

  return (
    <Shell className="cp-shell-scroll overflow-y-auto cp-fade-up">
      <View className="mb-5 items-center cp-fade-up">
        <View className="cp-logo-float mb-1">
          <View className="flex size-16 items-center justify-center rounded-full bg-secondary/25">
            <Medal className="size-8 text-secondary" strokeWidth={2.25} aria-hidden />
          </View>
        </View>
        <Text className="mb-1 text-center font-display text-2xl text-foreground">Couch medals</Text>
        <Text className="max-w-xs text-center font-body text-sm text-muted-foreground">
          {medalsEarned > 0
            ? `${medalsEarned} medal${medalsEarned === 1 ? "" : "s"} earned so far. The pile only grows.`
            : "No medals yet. Play a round and start the pile."}
        </Text>
      </View>

      {SECTIONS.map((section, i) => (
        <View key={section.title} className={`mb-5 cp-fade-up cp-stagger-${Math.min(i + 1, 3)}`}>
          <Text className="font-display text-base font-bold text-foreground">{section.title}</Text>
          <Text className="mb-3 font-body text-xs text-muted-foreground">{section.blurb}</Text>
          <View className="cp-lobby-card p-4">
            <View className="gap-4">
              {section.ids.map((id) => {
                const progress = progressById.get(id);
                if (!progress) return null;
                return <AchievementTrackRow key={id} progress={progress} withMilestones />;
              })}
            </View>
          </View>
        </View>
      ))}

      <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
        <Sofa />
        Back to lobby
      </Button>
    </Shell>
  );
}
