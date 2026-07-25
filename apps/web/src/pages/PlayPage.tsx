import { Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CircleStop,
  Eye,
  Moon,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import {
  ConfettiBurst,
  LetterGrid,
  LoadingPotato,
  ProgressBar,
  ScoreBubble,
  Shell,
  type Cell,
} from "@couch-potato/ui";
import { getDictionary } from "@couch-potato/dictionary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { IconTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  createGame,
  generateBoard,
  highScoreKey,
  isAdjacentCells,
  missedLongWords,
  quitGame,
  rotateBoard,
  scoreWord,
  sortWordsByLengthThenAlpha,
  submitPath,
  tickTimer,
  wordFromPath,
  type GameState,
  type GridTopology,
  type MinWordLength,
} from "@couch-potato/game-engine";
import { play, setEnabled } from "cuelume";
import { isRejectedWordSubmit, playRejectedWordSound } from "../wordRejectSound";
import { toast } from "sonner";
import { track } from "../analytics";
import { playBoardClearedSound } from "../boardClearSound";
import {
  getActiveProfile,
  loadDevicePrefs,
  loadLaunch,
  recordFinishedRun,
  saveLastRun,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  setThemePreference,
} from "../storage";
import { applyMenuMusicEnabled } from "../menuMusic";
import { applyTheme, resolveTheme } from "../theme";
import { playAcceptedWordSound } from "../wordAcceptSound";

const WIN_FLOURISH_MS = 1300;
const BOARD_CLEAR_FLASH_MS = 1400;
/** Must match `.cp-board-spin.is-turning` in `apps/web/src/index.css`. */
const BOARD_SPIN_MS = 300;

const REJECT_FLASH: Record<"short" | "invalid" | "duplicate", string> = {
  short: "Too short",
  invalid: "Not a word",
  duplicate: "Already found",
};

/** HUD pill heat: 0 muted → 1 soft sage → 2 path → 3 potato gold. */
function hudHeatTier(progress: number): 0 | 1 | 2 | 3 {
  if (progress >= 0.72) return 3;
  if (progress >= 0.42) return 2;
  if (progress >= 0.18) return 1;
  return 0;
}

/** Couch break pref row: feature name + Switch (on = secondary). */
function PausePrefRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  Icon,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  Icon?: LucideIcon;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "cp-pref-row flex w-full cursor-pointer items-center justify-between gap-3",
        checked && "cp-pref-row-on",
      )}
    >
      <span className={cn("flex min-w-0 gap-2.5", description ? "items-start" : "items-center")}>
        {Icon ? (
          <Icon
            className={cn(
              "cp-lobby-glyph size-4 shrink-0",
              description && "mt-0.5",
              checked ? "text-secondary-foreground" : "text-muted-foreground",
            )}
            strokeWidth={2.25}
            aria-hidden
          />
        ) : null}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-sm font-bold text-foreground">{label}</span>
          {description ? (
            <span className="font-body text-[0.65rem] leading-snug text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={`${label} ${checked ? "on" : "off"}`}
      />
    </label>
  );
}

export function PlayPage() {
  const navigate = useNavigate();
  const dict = useMemo(() => getDictionary(), []);
  const launch = useMemo(() => loadLaunch(), []);
  const topology = (launch.topology ?? "square") as GridTopology;
  const [state, setState] = useState<GameState | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const [flash, setFlash] = useState("");
  const [lastFound, setLastFound] = useState<{ id: number; word: string; points: number } | null>(
    null,
  );
  const lastFoundIdRef = useRef(0);
  const [firstWord, setFirstWord] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const prefs = useMemo(() => loadDevicePrefs(), []);
  const [sound, setSound] = useState(prefs.soundEnabled);
  const [menuMusic, setMenuMusic] = useState(prefs.menuMusicEnabled);
  const [showWordsLeft, setShowWordsLeftState] = useState(prefs.showWordsLeft);
  const [themePref, setThemePref] = useState(prefs.themePreference);
  const [paused, setPaused] = useState(false);
  const [boardTurnDeg, setBoardTurnDeg] = useState(0);
  const [boardTurning, setBoardTurning] = useState(false);
  const [hudPulse, setHudPulse] = useState(false);
  const finished = useRef(false);
  const boardClearedRef = useRef(false);
  const rotatingRef = useRef(false);
  const rotateFallbackRef = useRef<number | null>(null);
  const rotateStepsRef = useRef<1 | -1>(1);
  const hudSignalRef = useRef<{ remaining: number | null; score: number } | null>(null);

  const openPause = () => {
    setPath([]);
    setPaused(true);
  };

  const closePause = () => {
    setPaused(false);
  };

  const setSoundOn = (next: boolean) => {
    setSound(next);
    setSoundEnabled(next);
    setEnabled(next);
  };

  const setMenuMusicOn = (next: boolean) => {
    setMenuMusic(next);
    setMenuMusicEnabled(next);
    applyMenuMusicEnabled(next);
  };

  const setWordsLeftOn = (next: boolean) => {
    setShowWordsLeftState(next);
    setShowWordsLeft(next);
  };

  const setDarkModeOn = (next: boolean) => {
    const pref = next ? "dark" : "light";
    setThemePref(pref);
    setThemePreference(pref);
    applyTheme(pref);
  };

  const celebrateBoardClear = () => {
    if (boardClearedRef.current) return;
    boardClearedRef.current = true;
    playBoardClearedSound();
    toast.success("Board cleared. Every word nabbed!");
    setFlash("BOARD CLEARED!");
    window.setTimeout(() => setFlash(""), BOARD_CLEAR_FLASH_MS);
  };

  useEffect(() => {
    const minWordLength = (launch.minWordLength ?? 3) as MinWordLength;
    const board = generateBoard({
      size: launch.grid,
      dict,
      topology,
      minWordLength,
      // Timed has no difficulty knob — generateBoard defaults to a medium letter mix.
      difficulty: launch.mode === "target" ? (launch.difficulty ?? "easy") : undefined,
    });
    const config =
      launch.mode === "target"
        ? {
            mode: "target" as const,
            difficulty: launch.difficulty ?? "easy",
            minWordLength,
          }
        : {
            mode: "timed" as const,
            duration: launch.duration ?? 60,
            minWordLength,
          };
    setState(createGame(board, config));
  }, [dict, launch, topology]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as {
      __cpForceWin?: () => void;
      __cpForceBoardClear?: () => void;
      __cpSetRemaining?: (remaining: number) => void;
    };
    w.__cpForceWin = () => {
      setState((s) =>
        s
          ? {
              ...s,
              score: Math.max(s.score, s.target ?? s.score),
              remaining: 0,
              ended: "won",
            }
          : s,
      );
    };
    w.__cpSetRemaining = (remaining: number) => {
      setState((s) =>
        s && s.remaining != null
          ? {
              ...s,
              remaining: Math.max(0, Math.floor(remaining)),
              score: Math.max(s.score, (s.target ?? 0) - Math.max(0, Math.floor(remaining))),
            }
          : s,
      );
    };
    w.__cpForceBoardClear = () => {
      setState((s) => {
        if (!s || s.board.allWords.length === 0) return s;
        return { ...s, found: [...s.board.allWords] };
      });
      celebrateBoardClear();
    };
    return () => {
      delete w.__cpForceWin;
      delete w.__cpSetRemaining;
      delete w.__cpForceBoardClear;
    };
  }, []);

  useEffect(() => {
    if (!state || state.config.mode !== "timed" || state.ended || paused) return;
    const id = window.setInterval(() => {
      setState((s) => (s ? tickTimer(s, 250) : s));
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.config.mode, state?.ended, paused]);

  useEffect(() => {
    if (!state) return;
    const prev = hudSignalRef.current;
    hudSignalRef.current = { remaining: state.remaining, score: state.score };
    if (!prev) return;
    const cleared =
      state.remaining != null && prev.remaining != null && state.remaining < prev.remaining;
    const hauled = state.score > prev.score;
    if (!cleared && !hauled) return;
    setHudPulse(true);
    const id = window.setTimeout(() => setHudPulse(false), 420);
    return () => window.clearTimeout(id);
  }, [state?.remaining, state?.score]);

  useEffect(() => {
    if (celebrate || !state || state.ended) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (paused) closePause();
      else openPause();
    };
    // Capture so we own Escape (open + close) before Radix dismiss.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [paused, celebrate, state?.ended, state == null]);

  useEffect(() => {
    if (!state?.ended || finished.current) return;
    finished.current = true;
    void finish(state);
  }, [state?.ended]);

  const finish = async (s: GameState) => {
    const profile = getActiveProfile();
    const key = highScoreKey(profile.id, s.board.size, s.config, s.board.topology);
    const { isHighScore: isHigh } = recordFinishedRun({
      score: s.score,
      scoreKey: key,
      mode: s.config.mode,
      grid: s.board.size,
      minWordLength: s.config.minWordLength,
      difficulty: s.config.mode === "target" ? s.config.difficulty : undefined,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
      reason: s.ended!,
      wordsFound: s.found.length,
    });
    const missed = missedLongWords(s, dict);
    const detail =
      s.config.mode === "target"
        ? `${s.config.difficulty} · ${s.config.minWordLength}+`
        : `${s.config.duration}s · ${s.config.minWordLength}+`;
    saveLastRun({
      score: s.score,
      found: sortWordsByLengthThenAlpha(s.found),
      missed,
      reason: s.ended!,
      mode: s.config.mode,
      grid: s.board.size,
      detail,
      isHighScore: isHigh,
      minWordLength: s.config.minWordLength,
      difficulty: s.config.mode === "target" ? s.config.difficulty : undefined,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
    });
    track("game_completed", {
      reason: s.ended!,
      score: s.score,
      words: s.found.length,
    });

    if (s.ended === "won") {
      setCelebrate(true);
      // Board-clear SFX already covered sparkle/bloom/ready — keep confetti only.
      if (!boardClearedRef.current) {
        play("bloom");
        window.setTimeout(() => play("sparkle"), 180);
      }
      await new Promise((r) => window.setTimeout(r, WIN_FLOURISH_MS));
    } else {
      play("ready");
    }

    navigate({ to: "/results" });
  };

  if (!state) {
    return (
      <Shell>
        <LoadingPotato message="Fluffing the letter cushions…" />
      </Shell>
    );
  }

  const currentWord = wordFromPath(state.board.letters, path).toUpperCase();
  const wordPoints = scoreWord(currentWord.length);
  const target = state.target ?? 0;
  const remaining = state.remaining;
  const wordsLeft = state.board.allWords.length - state.found.length;
  const secs = state.remainingMs != null ? Math.ceil(state.remainingMs / 1000) : null;
  const adjacent = (a: Cell, b: Cell) => isAdjacentCells(a, b, state.board.topology);
  const boardLocked = celebrate || boardTurning || paused;
  const heatProgress =
    remaining != null && target > 0
      ? Math.min(1, Math.max(0, 1 - remaining / target))
      : state.board.maxScore > 0
        ? Math.min(1, state.score / state.board.maxScore)
        : 0;
  const heatTier = hudHeatTier(heatProgress);
  const hudBubbleClass = [
    "cp-hud-bubble",
    heatTier > 0 ? `cp-hud-heat-${heatTier}` : "",
    hudPulse ? "is-pulsing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const applyRotate = (steps: 1 | -1) => {
    setState((s) => (s ? { ...s, board: rotateBoard(s.board, steps) } : s));
    play("ready");
  };

  const clearRotateFallback = () => {
    if (rotateFallbackRef.current == null) return;
    window.clearTimeout(rotateFallbackRef.current);
    rotateFallbackRef.current = null;
  };

  /** Remap letters + clear CSS turn in one paint — idle has `transition: none` so no reverse spin. */
  const finishBoardTurn = () => {
    if (!rotatingRef.current) return;
    const steps = rotateStepsRef.current;
    clearRotateFallback();
    rotatingRef.current = false;
    rotateStepsRef.current = 1;
    // Drop `is-turning` before angle reset so transform snaps with remapped letters.
    setBoardTurning(false);
    setBoardTurnDeg(0);
    applyRotate(steps);
  };

  const rotate = (dir: 1 | -1) => {
    if (celebrate || paused || rotatingRef.current) return;
    setPath([]);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Hex: 90° container spin can't land on odd-r honeycomb — remap only (still letters-only).
    if (reduceMotion || topology === "hex") {
      applyRotate(dir);
      return;
    }
    const stepDeg = dir * 90;
    rotatingRef.current = true;
    rotateStepsRef.current = dir;
    setBoardTurning(true);
    // One frame so `is-turning` (transition on) applies before the angle changes.
    requestAnimationFrame(() => {
      if (!rotatingRef.current) return;
      setBoardTurnDeg(stepDeg);
      // Primary unlock = animation end (transitionend may also finish early).
      clearRotateFallback();
      rotateFallbackRef.current = window.setTimeout(() => {
        if (rotatingRef.current) finishBoardTurn();
      }, BOARD_SPIN_MS);
    });
  };

  return (
    <Shell className="relative overflow-hidden cp-fade-up">
      <ConfettiBurst active={celebrate} durationMs={WIN_FLOURISH_MS} />

      {/* One calm top row: primary status + optional words-left count + icon cluster */}
      <View className="mb-3 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          {remaining != null ? (
            <View className={hudBubbleClass} accessibilityLabel={`${remaining} points to clear`}>
              <Text
                className="font-display text-lg font-bold leading-none"
                style={{ color: "inherit" }}
              >
                {remaining} pts
              </Text>
            </View>
          ) : secs != null ? (
            <View className={hudBubbleClass} accessibilityLabel={`${secs} seconds left`}>
              <Text
                className="font-display text-lg font-bold leading-none"
                style={{ color: "inherit" }}
              >
                {secs}s
              </Text>
            </View>
          ) : null}
          {showWordsLeft ? (
            <Text
              className="font-display text-sm font-semibold text-muted-foreground"
              accessibilityLabel={`${wordsLeft} words left on the board`}
            >
              {wordsLeft} left
            </Text>
          ) : null}
        </View>
        <View className="shrink-0 flex-row items-center gap-2">
          <IconTooltip label={sound ? "SFX on" : "SFX off"}>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={celebrate}
              aria-pressed={sound}
              aria-label={sound ? "SFX on" : "SFX off"}
              onClick={() => setSoundOn(!sound)}
            >
              {sound ? <Volume2 className="cp-icon-anim-wave" /> : <VolumeX />}
            </Button>
          </IconTooltip>
          <IconTooltip label="Pause">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={celebrate}
              aria-label="Pause"
              aria-haspopup="dialog"
              aria-expanded={paused}
              onClick={openPause}
              data-testid="pause-menu"
            >
              <Pause />
            </Button>
          </IconTooltip>
        </View>
      </View>

      {remaining != null && target > 0 && (
        <ProgressBar value={remaining} max={target} className="mb-4" />
      )}

      <ScoreBubble
        word={celebrate ? "Couch clear!" : currentWord || flash}
        points={celebrate ? 0 : wordPoints}
        hint={
          remaining != null
            ? `Clear the couch · ${state.config.minWordLength}+`
            : `${state.config.minWordLength}+ letters`
        }
        className="mb-4"
      />

      <LetterGrid
        letters={state.board.letters}
        topology={state.board.topology}
        isAdjacent={adjacent}
        selected={boardLocked ? [] : path}
        dropping={celebrate}
        boardTurnDeg={boardTurnDeg}
        boardTurning={boardTurning}
        interactive={!boardLocked}
        onBoardTurnEnd={finishBoardTurn}
        onPathChange={boardLocked ? undefined : setPath}
        onPathEnd={
          boardLocked
            ? undefined
            : (p) => {
                if (rotatingRef.current) return;
                const { state: next, result } = submitPath(state, p, dict);
                setPath([]);
                if (result.ok) {
                  track("word_found", {
                    word: result.word,
                    points: result.points,
                  });
                  lastFoundIdRef.current += 1;
                  setLastFound({
                    id: lastFoundIdRef.current,
                    word: result.word.toUpperCase(),
                    points: result.points,
                  });
                  const boardCleared =
                    next.board.allWords.length > 0 &&
                    next.found.length === next.board.allWords.length;
                  if (boardCleared) {
                    celebrateBoardClear();
                  } else {
                    playAcceptedWordSound(result.word.length, { firstWord });
                    setFlash(result.word.toUpperCase());
                    window.setTimeout(() => setFlash(""), 700);
                  }
                  setFirstWord(false);
                  setState(next);
                } else if (isRejectedWordSubmit(result.reason)) {
                  playRejectedWordSound();
                  setFlash(REJECT_FLASH[result.reason] ?? result.reason);
                  window.setTimeout(() => setFlash(""), 700);
                }
              }
        }
      />

      {/* One row: rotate controls flank a centered last-catch slot — never grows board height. */}
      <div className="mt-4 flex w-full shrink-0 items-center justify-center gap-2">
        <IconTooltip label="Spin left">
          <Button
            variant="secondary"
            size="icon"
            disabled={celebrate || boardTurning || paused}
            onClick={() => rotate(-1)}
            aria-label="Spin board left"
            data-testid="rotate-ccw"
          >
            <RotateCcw className="size-5" />
          </Button>
        </IconTooltip>

        <div className="flex min-h-11 min-w-0 flex-1 items-center justify-center">
          {lastFound ? (
            <div key={lastFound.id} className="cp-last-found cp-catch-in" role="status">
              <span className="cp-last-found-label">Last catch</span>
              <span className="cp-last-found-word">{lastFound.word}</span>
              {lastFound.points > 0 ? (
                <span className="cp-last-found-pts" aria-label={`${lastFound.points} points`}>
                  {lastFound.points}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <IconTooltip label="Spin right">
          <Button
            variant="secondary"
            size="icon"
            disabled={celebrate || boardTurning || paused}
            onClick={() => rotate(1)}
            aria-label="Spin board right"
            data-testid="rotate-cw"
          >
            <RotateCw className="size-5" />
          </Button>
        </IconTooltip>
      </div>

      <Dialog
        open={paused}
        onOpenChange={(open) => {
          if (open) openPause();
          else closePause();
        }}
      >
        <DialogContent
          className="gap-3"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            const resume = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
              "[data-pause-resume]",
            );
            if (resume) {
              e.preventDefault();
              resume.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Couch break</DialogTitle>
            <DialogDescription>Timer paused. Swipe waits for you.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Button data-pause-resume className="w-full justify-start" onClick={closePause}>
              Resume
            </Button>
            <PausePrefRow id="pause-sfx" label="SFX" checked={sound} onCheckedChange={setSoundOn} />
            <PausePrefRow
              id="pause-background-music"
              label="Background music"
              checked={menuMusic}
              onCheckedChange={setMenuMusicOn}
            />
            <PausePrefRow
              id="pause-words-left"
              label="Show words left"
              description="During play, show a running count of words still to find"
              Icon={Eye}
              checked={showWordsLeft}
              onCheckedChange={setWordsLeftOn}
            />
            <PausePrefRow
              id="pause-dark-mode"
              label="Dark mode"
              Icon={Moon}
              checked={resolveTheme(themePref) === "dark"}
              onCheckedChange={setDarkModeOn}
            />
            <Button
              variant="ghost"
              className="cp-end-run-btn w-full"
              data-testid="end-run"
              onClick={() => {
                closePause();
                setState(quitGame(state));
              }}
            >
              <CircleStop className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
              End run
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
