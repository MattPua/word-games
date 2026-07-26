import { Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CirclePlay,
  CircleStop,
  Eye,
  EyeOff,
  Moon,
  Music2,
  Pause,
  RotateCcwSquare,
  RotateCwSquare,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MusicOff } from "@/icons/MusicOff";
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
import { IconTooltip } from "@/components/ui/tooltip";
import { PrefChoiceGroup } from "@/components/PrefChoiceGroup";
import {
  createGame,
  generateBoard,
  highScoreKey,
  isAdjacentCells,
  missedLongWords,
  quitGame,
  rotateBoard,
  sortWordsByLengthThenAlpha,
  submitPath,
  SURVIVAL_START_SECONDS,
  tickTimer,
  wordFromPath,
  type GameConfig,
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

/** Timed HUD urgency: 0 calm → 1 warn → 2 critical (destructive). */
function hudTimerUrgency(secs: number, durationSec: number): 0 | 1 | 2 {
  const criticalThreshold = Math.min(10, durationSec * 0.15);
  const warnThreshold = Math.min(20, durationSec * 0.3);
  if (secs <= criticalThreshold) return 2;
  if (secs <= warnThreshold) return 1;
  return 0;
}

/**
 * Urgency baseline seconds by mode — timed uses the fixed sprint length,
 * survival uses its starting clock (refills don't reset the baseline, so
 * urgency still reads relative to how stingy that difficulty starts).
 */
function timerBaselineSeconds(config: GameConfig): number | null {
  if (config.mode === "timed") return config.duration;
  if (config.mode === "survival") return SURVIVAL_START_SECONDS[config.difficulty];
  return null;
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
  const timerUrgencyRef = useRef<0 | 1 | 2>(0);
  /** Survival: total clock ever granted (start + all refills) so we can derive time survived at the end. */
  const survivalBudgetMsRef = useRef(0);
  /** Goal: wall-clock active play (pause excluded) for Potato Board WPM. */
  const goalElapsedMsRef = useRef(0);
  const goalTickAtRef = useRef<number | null>(null);
  const [survivalBump, setSurvivalBump] = useState<{ id: number; seconds: number } | null>(null);

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
      difficulty:
        launch.mode === "target" || launch.mode === "survival"
          ? (launch.difficulty ?? "easy")
          : undefined,
    });
    const config: GameConfig =
      launch.mode === "target"
        ? {
            mode: "target" as const,
            difficulty: launch.difficulty ?? "easy",
            minWordLength,
          }
        : launch.mode === "survival"
          ? {
              mode: "survival" as const,
              difficulty: launch.difficulty ?? "easy",
              minWordLength,
            }
          : {
              mode: "timed" as const,
              duration: launch.duration ?? 60,
              minWordLength,
            };
    survivalBudgetMsRef.current =
      config.mode === "survival" ? SURVIVAL_START_SECONDS[config.difficulty] * 1000 : 0;
    goalElapsedMsRef.current = 0;
    goalTickAtRef.current = null;
    setState(createGame(board, config));
  }, [dict, launch, topology]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as {
      __cpForceWin?: () => void;
      __cpForceBoardClear?: () => void;
      __cpSetRemaining?: (remaining: number) => void;
      __cpSetRemainingMs?: (remainingMs: number) => void;
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
    w.__cpSetRemainingMs = (remainingMs: number) => {
      setState((s) =>
        s && s.remainingMs != null
          ? { ...s, remainingMs: Math.max(0, Math.floor(remainingMs)) }
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
      delete w.__cpSetRemainingMs;
      delete w.__cpForceBoardClear;
    };
  }, []);

  useEffect(() => {
    if (!state || state.remainingMs == null || state.ended || paused) return;
    const id = window.setInterval(() => {
      setState((s) => (s ? tickTimer(s, 250) : s));
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.remainingMs == null, state?.ended, paused]);

  // Goal has no engine clock — accumulate wall time while unpaused for WPM.
  useEffect(() => {
    if (!state || state.ended || paused || state.config.mode !== "target") {
      goalTickAtRef.current = null;
      return;
    }
    goalTickAtRef.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (goalTickAtRef.current != null) {
        goalElapsedMsRef.current += now - goalTickAtRef.current;
      }
      goalTickAtRef.current = now;
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.ended, paused, state?.config.mode]);

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
    if (!state || state.remainingMs == null) return;
    const baselineSec = timerBaselineSeconds(state.config);
    if (baselineSec == null) return;
    const secs = Math.ceil(state.remainingMs / 1000);
    const urgency = hudTimerUrgency(secs, baselineSec);
    const prev = timerUrgencyRef.current;
    timerUrgencyRef.current = urgency;
    if (urgency <= prev || urgency === 0) return;
    setHudPulse(true);
    const id = window.setTimeout(() => setHudPulse(false), 420);
    return () => window.clearTimeout(id);
  }, [state?.remainingMs, state?.config]);

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
    const difficulty =
      s.config.mode === "target" || s.config.mode === "survival" ? s.config.difficulty : undefined;
    const survivalDurationMs =
      s.config.mode === "survival" ? survivalBudgetMsRef.current - (s.remainingMs ?? 0) : undefined;
    // Flush any in-flight Goal tick before reading wall-clock.
    if (s.config.mode === "target" && goalTickAtRef.current != null) {
      goalElapsedMsRef.current += performance.now() - goalTickAtRef.current;
      goalTickAtRef.current = null;
    }
    const activePlayMs =
      s.config.mode === "timed"
        ? Math.max(0, s.config.duration * 1000 - (s.remainingMs ?? 0))
        : s.config.mode === "survival"
          ? Math.max(0, survivalDurationMs ?? 0)
          : Math.max(0, Math.round(goalElapsedMsRef.current));
    const {
      isHighScore: isHigh,
      achievements: achievementsSnapshot,
      stageUps,
      touched,
    } = recordFinishedRun({
      score: s.score,
      scoreKey: key,
      mode: s.config.mode,
      grid: s.board.size,
      minWordLength: s.config.minWordLength,
      difficulty,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
      reason: s.ended!,
      wordsFound: s.found.length,
      words: s.found,
      survivalDurationMs,
      activePlayMs,
    });
    const missed = missedLongWords(s, dict);
    const detail =
      s.config.mode === "target"
        ? `${s.config.difficulty} · ${s.config.minWordLength}+`
        : s.config.mode === "survival"
          ? `Survival · ${s.config.difficulty} · ${s.config.minWordLength}+`
          : `${s.config.duration}s · ${s.config.minWordLength}+`;
    saveLastRun({
      score: s.score,
      found: sortWordsByLengthThenAlpha(s.found),
      missed,
      reason: s.ended!,
      mode: s.config.mode,
      grid: s.board.size,
      topology: s.board.topology,
      detail,
      isHighScore: isHigh,
      minWordLength: s.config.minWordLength,
      difficulty,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
      achievements:
        stageUps.length || touched.length
          ? { snapshot: achievementsSnapshot, stageUps, touched }
          : undefined,
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
  const target = state.target ?? 0;
  const remaining = state.remaining;
  const wordsLeft = state.board.allWords.length - state.found.length;
  const secs = state.remainingMs != null ? Math.ceil(state.remainingMs / 1000) : null;
  const adjacent = (a: Cell, b: Cell) => isAdjacentCells(a, b, state.board.topology);
  const boardLocked = celebrate || boardTurning || paused;
  const heatProgress =
    remaining != null && target > 0 ? Math.min(1, Math.max(0, 1 - remaining / target)) : 0;
  const heatTier = remaining != null ? hudHeatTier(heatProgress) : 0;
  const timerBaselineSec = timerBaselineSeconds(state.config);
  const timerUrgency =
    secs != null && timerBaselineSec != null ? hudTimerUrgency(secs, timerBaselineSec) : 0;
  const hudBubbleClass = [
    "cp-hud-bubble",
    heatTier > 0 ? `cp-hud-heat-${heatTier}` : "",
    timerUrgency === 1 ? "cp-hud-timer-warn" : "",
    timerUrgency === 2 ? "cp-hud-timer-critical" : "",
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
          {/* `.cp-hud-bubble` already bakes in font-display/size/weight — the
              Text just needs to inherit color (bubble sets it per heat tier). */}
          {remaining != null ? (
            <View
              className={hudBubbleClass}
              accessibilityLabel={`${remaining} points left to clear`}
            >
              <Text style={{ color: "inherit" }}>{remaining} pts left</Text>
            </View>
          ) : secs != null ? (
            <View className={hudBubbleClass} accessibilityLabel={`${secs} seconds left`}>
              <Text style={{ color: "inherit" }}>{secs}s</Text>
            </View>
          ) : null}
          {survivalBump ? (
            <span
              key={survivalBump.id}
              className="cp-survival-bump cp-catch-in"
              aria-label={`Plus ${survivalBump.seconds} seconds`}
            >
              +{survivalBump.seconds}s
            </span>
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
        hint={
          remaining != null
            ? `Clear the couch · ${state.config.minWordLength}+`
            : state.config.mode === "survival"
              ? `Keep the clock fed · ${state.config.minWordLength}+`
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
                  if (result.bonusSeconds) {
                    survivalBudgetMsRef.current += result.bonusSeconds * 1000;
                    setSurvivalBump({ id: lastFoundIdRef.current, seconds: result.bonusSeconds });
                    setHudPulse(true);
                    window.setTimeout(() => setHudPulse(false), 420);
                    window.setTimeout(() => setSurvivalBump(null), 900);
                  }
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

      {/* One row: spin chips flank last-catch in a centered hug cluster (gap-2) — not
          full-width flex-1, which parked spins at opposite board edges. Same height as
          icon buttons; never grows board. Rotate*Square + “Spin” label. */}
      <div className="mt-4 flex w-full shrink-0 items-center justify-center gap-2">
        <IconTooltip label="Spin board left">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 shrink-0 gap-1 px-2.5"
            disabled={celebrate || boardTurning || paused}
            onClick={() => rotate(-1)}
            aria-label="Spin board left"
            data-testid="rotate-ccw"
          >
            <RotateCcwSquare className="size-4 shrink-0" aria-hidden />
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-wide">
              Spin
            </span>
          </Button>
        </IconTooltip>

        <div className="flex min-h-11 min-w-0 max-w-[14rem] items-center justify-center">
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

        <IconTooltip label="Spin board right">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 shrink-0 gap-1 px-2.5"
            disabled={celebrate || boardTurning || paused}
            onClick={() => rotate(1)}
            aria-label="Spin board right"
            data-testid="rotate-cw"
          >
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-wide">
              Spin
            </span>
            <RotateCwSquare className="size-4 shrink-0" aria-hidden />
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

          <div className="flex flex-col gap-3">
            <PrefChoiceGroup
              label="SFX"
              value={sound ? "on" : "off"}
              onChange={(v) => setSoundOn(v === "on")}
              data-testid="pause-sfx"
              options={[
                { value: "off", label: "Off", Icon: VolumeX },
                { value: "on", label: "On", Icon: Volume2 },
              ]}
            />
            <PrefChoiceGroup
              label="Lobby jam"
              value={menuMusic ? "on" : "off"}
              onChange={(v) => setMenuMusicOn(v === "on")}
              data-testid="pause-music"
              options={[
                { value: "off", label: "Off", Icon: MusicOff },
                { value: "on", label: "On", Icon: Music2 },
              ]}
            />
            <PrefChoiceGroup
              label="Words left"
              value={showWordsLeft ? "show" : "hide"}
              onChange={(v) => setWordsLeftOn(v === "show")}
              data-testid="pause-words-left"
              options={[
                { value: "hide", label: "Hide", hint: "Play blind", Icon: EyeOff },
                { value: "show", label: "Show", hint: "Count still to find", Icon: Eye },
              ]}
            />
            <PrefChoiceGroup
              label="Look"
              value={resolveTheme(themePref) === "dark" ? "dark" : "light"}
              onChange={(v) => setDarkModeOn(v === "dark")}
              data-testid="pause-look"
              options={[
                { value: "light", label: "Day", Icon: Sun },
                { value: "dark", label: "Night", Icon: Moon },
              ]}
            />
            <div className="mt-1 flex flex-wrap gap-2 border-t-2 border-border pt-3">
              <Button
                variant="ghost"
                className="cp-end-run-btn min-w-0 flex-1 justify-center gap-2.5"
                data-testid="end-run"
                onClick={() => {
                  closePause();
                  setState(quitGame(state));
                }}
              >
                <CircleStop className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
                End run
              </Button>
              <Button
                data-pause-resume
                className="min-w-0 flex-[1.15] justify-center gap-2.5"
                onClick={closePause}
              >
                <CirclePlay className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
                Resume
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
