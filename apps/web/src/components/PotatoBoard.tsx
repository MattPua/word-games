import { Gamepad2, Gauge, History, Library, Star, Trophy, WholeWord } from "lucide-react";
import { EmptyState } from "@couch-potato/ui";
import { cn } from "@/lib/utils";
import { ModeGlyph, type ModeGlyphId } from "../modeGlyph";
import { avgWordLength, avgWpm, formatPaceStat, normalizePaceStats } from "../profileStats";
import { formatWhen } from "../relativeTime";
import { formatDifficulty, formatModeLabel } from "../runMeta";
import { listHighScores, type GameHistoryEntry, type Profile } from "../storage";

const SECTION_ICON = "cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground";

function reasonLabel(r: GameHistoryEntry["reason"]) {
  if (r === "won") return "Cleared";
  if (r === "timeout") return "Timed out";
  return "Ended";
}

function modeFromScoreKey(key: string): ModeGlyphId {
  for (const part of key.split(":")) {
    if (part === "target" || part === "timed" || part === "survival") return part;
  }
  return "target";
}

function modeChipClass(mode: ModeGlyphId) {
  if (mode === "timed") return "cp-results-meta-mode cp-results-meta-mode-timed";
  if (mode === "survival") return "cp-results-meta-mode cp-results-meta-mode-survival";
  return "cp-results-meta-mode cp-results-meta-mode-target";
}

function reasonChipClass(reason: GameHistoryEntry["reason"]) {
  if (reason === "won") return "cp-board-run-reason-won";
  if (reason === "timeout") return "cp-board-run-reason-timeout";
  return "cp-board-run-reason-ended";
}

function historyDetail(h: GameHistoryEntry) {
  const grid = `${h.grid}×${h.grid}`;
  const diff = formatDifficulty(h.difficulty ?? "easy");
  const min = `${h.minWordLength}+`;
  const words = `${h.wordsFound} word${h.wordsFound === 1 ? "" : "s"}`;
  if (h.mode === "timed") return `${grid} · ${diff} · ${h.duration ?? 60}s · ${min} · ${words}`;
  return `${grid} · ${diff} · ${min} · ${words}`;
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
    <div className="cp-lobby-panel flex min-w-0 flex-col gap-2 !p-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${wash}`}>
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </div>
        <span className="min-w-0 font-body text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
          {label}
        </span>
      </div>
      <span className="font-display text-2xl leading-none tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function ScorePlaque({ score, gold }: { score: number; gold?: boolean }) {
  return (
    <span className={cn("cp-board-run-score", gold && "cp-board-run-score-gold")}>
      <span className="tabular-nums">{score}</span>
      <span className="cp-board-run-score-unit">points</span>
    </span>
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
        <StatCard label="Words/min" value={wpm} icon={Gauge} tone="primary" />
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
              <div className="cp-crew-board-scroll flex flex-col gap-2.5">
                {highs.map((h) => {
                  const mode = modeFromScoreKey(h.key);
                  return (
                    <div key={h.key} className="cp-board-run cp-lobby-card p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          <span
                            className={cn(
                              "cp-results-meta-chip shrink-0 !min-h-9 !px-2",
                              modeChipClass(mode),
                            )}
                            aria-label={formatModeLabel(mode)}
                          >
                            <ModeGlyph mode={mode} className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-sm leading-snug text-foreground [overflow-wrap:anywhere]">
                              {h.label}
                            </p>
                            {h.at ? (
                              <p className="mt-1 font-body text-xs text-muted-foreground">
                                Best {formatWhen(h.at)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <ScorePlaque score={h.score} gold />
                      </div>
                    </div>
                  );
                })}
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
                title="No recent runs"
                body="Finished games leave a trail here (last 20)."
                className="py-2"
              />
            ) : (
              <div className="cp-crew-board-scroll flex flex-col gap-2.5">
                {recent.map((h) => (
                  <div
                    key={h.id}
                    className={cn(
                      "cp-board-run cp-lobby-card p-3.5",
                      h.isHighScore && "cp-board-run-best",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <span
                          className={cn(
                            "cp-results-meta-chip shrink-0 !min-h-9 !px-2",
                            modeChipClass(h.mode),
                          )}
                          aria-label={formatModeLabel(h.mode)}
                        >
                          <ModeGlyph mode={h.mode} className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <ScorePlaque score={h.score} gold={h.isHighScore} />
                            {h.isHighScore ? (
                              <span className="inline-flex items-center gap-1 rounded-ui border-2 border-secondary bg-secondary/25 px-1.5 py-0.5 font-display text-[0.65rem] font-bold text-secondary-foreground">
                                <Star
                                  className="size-3 text-secondary"
                                  strokeWidth={2.25}
                                  fill="currentColor"
                                  aria-hidden
                                />
                                Best
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                "cp-results-meta-chip !min-h-0 py-0.5 text-[0.65rem]",
                                reasonChipClass(h.reason),
                              )}
                            >
                              {reasonLabel(h.reason)}
                            </span>
                          </div>
                          <p className="mt-1.5 font-body text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                            {historyDetail(h)}
                          </p>
                          <p className="mt-0.5 font-body text-xs text-muted-foreground">
                            {formatWhen(h.at)}
                          </p>
                        </div>
                      </div>
                    </div>
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
