import { useNavigate } from "@tanstack/react-router";
import { Sofa } from "lucide-react";
import {
  MedalsCategorySprite,
  ScrollShell,
  type MedalsCategoryFrame,
} from "@couch-potato/ui";
import { allTrackProgress, withGamesPlayed, type TrackId } from "../achievements";
import { getActiveProfile } from "../storage";
import { AchievementTrackRow } from "@/components/achievementUi";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ChromeTopBar";

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
      <PageHeading
        className="cp-fade-up"
        title="Couch medals"
        description={
          medalsEarned > 0
            ? `${medalsEarned} medal${medalsEarned === 1 ? "" : "s"} earned so far. The pile only grows.`
            : "No medals yet. Play a round and start the pile."
        }
      />

      <div className="cp-medals-columns mb-5">
        {SECTIONS.map((section, i) => (
          <div
            key={section.title}
            className={`cp-medals-section cp-fade-up cp-stagger-${Math.min(i + 1, 3)}`}
          >
            <h2 className="mb-0.5 text-base font-bold text-foreground">{section.title}</h2>
            <span className="mb-3 block font-body text-xs text-muted-foreground">
              {section.blurb}
            </span>
            <div
              className={`cp-lobby-card cp-medals-section-card p-4 ${
                section.ids.length > 4 ? "cp-medals-section-card-scroll" : ""
              }`}
            >
              <MedalsCategorySprite
                frame={section.frame}
                size={200}
                className="cp-medals-section-mascot"
              />
              <div className="cp-medals-section-body">
                {section.ids.map((id) => {
                  const progress = progressById.get(id);
                  if (!progress) return null;
                  return <AchievementTrackRow key={id} progress={progress} detailed />;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
