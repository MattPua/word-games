import { Gamepad2, Gauge, History, Library, Star, Trophy, WholeWord } from "lucide-react";
import { EmptyState } from "@couch-potato/ui";
import { avgWordLength, avgWpm, formatPaceStat, normalizePaceStats } from "../profileStats";
import { formatWhen } from "../relativeTime";
import { listHighScores, type GameHistoryEntry, type Profile } from "../storage";

const SECTION_ICON = "cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground";

function reasonLabel(r: GameHistoryEntry["reason"]) {
  if (r === "won") return "cleared";
  if (r === "timeout") return "timed out";
  return "ended";
}

function historyLabel(h: GameHistoryEntry) {
  if (h.mode === "target")
    return `${h.grid}×${h.grid} ${h.difficulty ?? "?"} · ${h.minWordLength}+`;
  if (h.mode === "survival") {
    return `${h.grid}×${h.grid} survival ${h.difficulty ?? "?"} · ${h.minWordLength}+`;
  }
  return `${h.grid}×${h.grid} ${h.difficulty ?? "?"} · ${h.duration ?? "?"}s · ${h.minWordLength}+`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Gamepad2;
  tone: "primary" | "secondary";
}) {
  const wash = tone === "primary" ? "bg-primary/18 text-primary" : "bg-secondary/22 text-secondary";
  return (
    <div className="cp-lobby-panel flex-1 flex flex-row items-center gap-2.5 !p-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${wash}`}>
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </div>
      <div className="min-w-0">
        <span className="font-body text-xs text-muted-foreground">{label}</span>
        <span className="font-display text-xl text-foreground">{value}</span>
      </div>
    </div>
  );
}

/** Local-only personal scoreboard — “Potato Board”. */
export function PotatoBoard({ profile }: { profile: Profile }) {
  const highs = listHighScores(profile);
  const recent = profile.history ?? [];
  const empty = highs.length === 0 && recent.length === 0;
  const pace = normalizePaceStats(profile.pace);
  const wpm = formatPaceStat(avgWpm(pace));
  const wordLen = formatPaceStat(avgWordLength(pace));

  return (
    <div className="mb-6">
      <h2 className="mb-1 flex items-center gap-2 text-xl text-foreground">
        <Trophy className={SECTION_ICON} strokeWidth={2.25} aria-hidden />
        Potato Board
      </h2>
      <span className="mb-3 font-body text-sm text-muted-foreground">
        Your local scoreboard. No cloud bragging.
      </span>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Runs" value={profile.gamesPlayed} icon={Gamepad2} tone="primary" />
        <StatCard label="Words" value={profile.wordsFound} icon={Library} tone="secondary" />
        <StatCard label="Words / min" value={wpm} icon={Gauge} tone="primary" />
        <StatCard label="Avg length" value={wordLen} icon={WholeWord} tone="secondary" />
      </div>

      {empty ? (
        <EmptyState
          showLogo
          title="Board's squeaky clean"
          body="Play a round. Bests and recent runs pile up right here."
          className="py-2"
        />
      ) : (
        <div className="cp-crew-board-columns flex flex-col gap-4">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-lg text-foreground">
              <Star className={SECTION_ICON} strokeWidth={2.25} aria-hidden />
              Personal bests
            </h3>
            {highs.length === 0 ? (
              <EmptyState
                title="No bests carved yet"
                body="Clear a goal or nab a timed haul and we'll keep the high water mark."
                className="py-2"
              />
            ) : (
              <div className="cp-crew-board-scroll">
                {highs.map((h) => (
                  <div
                    key={h.key}
                    className="mb-2 rounded-ui border-2 border-border bg-card px-3 py-2 last:mb-0"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <span className="flex-1 font-body text-sm text-foreground">{h.label}</span>
                      <span className="font-display text-lg text-primary">{h.score}</span>
                    </div>
                    <span className="font-body text-xs text-muted-foreground">
                      Best {formatWhen(h.at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-lg text-foreground">
              <History className={SECTION_ICON} strokeWidth={2.25} aria-hidden />
              Recent runs
            </h3>
            {recent.length === 0 ? (
              <EmptyState
                title="No recent crumbs"
                body="Finished games leave a trail here (last 20)."
                className="py-2"
              />
            ) : (
              <div className="cp-crew-board-scroll">
                {recent.map((h) => (
                  <div
                    key={h.id}
                    className="mb-2 rounded-ui border-2 border-border bg-card px-3 py-2 last:mb-0"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <span className="font-body text-sm font-bold text-foreground">
                        {h.score} pts
                        {h.isHighScore ? " ★" : ""}
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {reasonLabel(h.reason)} · {formatWhen(h.at)}
                      </span>
                    </div>
                    <span className="font-body text-xs text-muted-foreground">
                      {historyLabel(h)} · {h.wordsFound} words
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
