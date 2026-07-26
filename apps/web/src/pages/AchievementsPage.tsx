import { Text, View } from "react-native";
import { useNavigate } from "@tanstack/react-router";
import { Sofa } from "lucide-react";
import {
  BrandHeader,
  MedalsCategorySprite,
  ScrollShell,
  type MedalsCategoryFrame,
} from "@couch-potato/ui";
import { allTrackProgress, withGamesPlayed, type TrackId } from "../achievements";
import { getActiveProfile } from "../storage";
import { AchievementTrackRow } from "@/components/achievementUi";
import { Button } from "@/components/ui/button";
import { ChromeNav } from "@/components/ChromeNav";

const SECTIONS: {
  title: string;
  blurb: string;
  ids: TrackId[];
  frame: MedalsCategoryFrame;
}[] = [
  {
    title: "The big picture",
    blurb: "Every run pads these out",
    ids: ["points", "words", "sessions"],
    frame: "bigPicture",
  },
  {
    title: "Personal bests",
    blurb: "Your single best run, not the lifetime pile",
    ids: ["bestRunPoints", "bestRunWords"],
    frame: "personalBests",
  },
  {
    title: "Length hauls",
    blurb: "Counted every time you nab one, repeats and all",
    ids: ["len3", "len4", "len5", "len6", "len7", "len8", "len9plus"],
    frame: "lengthHauls",
  },
  {
    title: "Survival",
    blurb: "Stay alive as long as you can, one word at a time",
    ids: ["survivalTime", "survivalWords"],
    frame: "survival",
  },
];

export function AchievementsPage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  const ctx = withGamesPlayed(profile.achievements, profile.gamesPlayed);
  const progressById = new Map(allTrackProgress(ctx).map((p) => [p.track.id, p]));
  const medalsEarned = [...progressById.values()].reduce((sum, p) => sum + p.stage, 0);

  return (
    <ScrollShell shellClassName="cp-shell-medals cp-medals cp-fade-up">
      <div className="mb-3 flex justify-end">
        <ChromeNav />
      </div>
      <BrandHeader
        className="mb-5 cp-fade-up"
        mark={<MedalsCategorySprite frame="personalBests" size={72} />}
        title="Couch medals"
        description={
          medalsEarned > 0
            ? `${medalsEarned} medal${medalsEarned === 1 ? "" : "s"} earned so far. The pile only grows.`
            : "No medals yet. Play a round and start the pile."
        }
      />

      <div className="cp-medals-columns mb-5">
        {SECTIONS.map((section, i) => (
          <View key={section.title} className={`cp-fade-up cp-stagger-${Math.min(i + 1, 3)}`}>
            <div className="mb-1 flex items-center gap-2">
              <MedalsCategorySprite frame={section.frame} size={40} />
              <h2 className="text-base font-bold text-foreground">{section.title}</h2>
            </div>
            <Text className="mb-3 font-body text-xs text-muted-foreground">{section.blurb}</Text>
            <View className="cp-lobby-card p-4">
              <View className="gap-4">
                {section.ids.map((id) => {
                  const progress = progressById.get(id);
                  if (!progress) return null;
                  return <AchievementTrackRow key={id} progress={progress} detailed />;
                })}
              </View>
            </View>
          </View>
        ))}
      </div>

      <Button variant="outline" className="cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
