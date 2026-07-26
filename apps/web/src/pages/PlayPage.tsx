import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi, useBlocker, useNavigate } from "@tanstack/react-router";
import {
  CirclePlay,
  CircleStop,
  Eye,
  EyeOff,
  Moon,
  Music2,
  Pause,
  RotateCcw,
  RotateCcwSquare,
  RotateCwSquare,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MusicOff } from "@/icons/MusicOff";
import { cn } from "@/lib/utils";
import {
  ConfettiBurst,
  LetterGrid,
  PrefChoiceGroup,
  ProgressBar,
  ScoreBubble,
  Shell,
  TimerRing,
  type Cell,
} from "@couch-potato/ui";
import type { Dictionary } from "@couch-potato/dictionary";
import { PlaySkeleton } from "@/components/PlaySkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconTooltip } from "@/components/ui/tooltip";
import {
  createGame,
  generateBoard,
  highScoreKey,
  isAdjacentCells,
  missedLongWords,
  missedOtherWords,
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
import { bind, play, setEnabled } from "cuelume";
import { isRejectedWordSubmit, playRejectedWordSound } from "../wordRejectSound";
import { toast } from "sonner";
import {
  consumePlayVia,
  launchAnalyticsProps,
  nextSessionRun,
  peekSessionRun,
  setPlayVia,
  track,
  trackOptionsPrefChanged,
  trackWordRejected,
} from "../analytics";
import { playBoardClearedSound } from "../boardClearSound";
import {
  getActiveProfile,
  loadDevicePrefs,
  recordFinishedRun,
  saveBoardSnapshot,
  saveLastRun,
  saveLaunch,
  cloneLetters,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  setThemePreference,
} from "../storage";
import { applyMenuMusicEnabled } from "../menuMusic";
import { applyTheme, resolveTheme } from "../theme";
import { playAcceptedWordSound } from "../wordAcceptSound";
import { formatRunChallengeBadge, formatRunMeta } from "../runMeta";
import { ModeGlyph } from "../modeGlyph";
import { playLaunchFromSearch } from "../playLaunchSearch";
import { playRunEndSound, runEndPill, type RunEndReason } from "../runEndFlourish";

const playRouteApi = getRouteApi("/play");

/** Board tile-drop + confetti hold before Results (won / timeout / quit). */
const END_FLOURISH_MS = 1300;
const BOARD_CLEAR_FLASH_MS = 1400;
/** Must match `.cp-board-spin.is-turning` in `apps/web/src/index.css`. */
const BOARD_SPIN_MS = 300;
/** End/Leave within this window after board ready → lobby, no haul recorded. */
const EARLY_QUIT_MS = 3000;

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
  /** Per-run lexicon (house bans snapshotted at beginFreshRun — not live prefs). */
  const dictRef = useRef<Dictionary | null>(null);
  const search = playRouteApi.useSearch();
  const launch = useMemo(() => {
    const next = playLaunchFromSearch(search);
    saveLaunch(next);
    return next;
    // Prefer field deps — search object identity can churn every render.
  }, [search.mode, search.grid, search.board, search.min, search.diff, search.time]);
  const topology = (launch.topology ?? "square") as GridTopology;
  const [state, setState] = useState<GameState | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const [flash, setFlash] = useState("");
  const [lastFound, setLastFound] = useState<{ id: number; word: string; points: number } | null>(
    null,
  );
  const lastFoundIdRef = useRef(0);
  const [firstWord, setFirstWord] = useState(true);
  /** Seconds from board ready to first accepted word (null until nabbed). */
  const secondsToFirstRef = useRef<number | null>(null);
  const rotatesRef = useRef(0);
  const pauseOpensRef = useRef(0);
  const sessionRunRef = useRef(0);
  /** Non-null while the end-run curtain call plays (tiles drop + confetti). */
  const [endBeat, setEndBeat] = useState<RunEndReason | null>(null);
  const celebrate = endBeat != null;
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
  /** Wall-clock when board became ready (`beginFreshRun`); 0 = not started. */
  const runStartedAtRef = useRef(0);
  /** Open run in progress — leave dumps the haul (no results). Finish → /results is allowed. */
  const runActiveRef = useRef(false);
  runActiveRef.current = Boolean(state && !state.ended);

  const isEarlyBail = () =>
    runStartedAtRef.current > 0 && performance.now() - runStartedAtRef.current < EARLY_QUIT_MS;

  const shouldBlockLeave = useCallback(
    ({
      current,
      next,
    }: {
      current: { pathname: string };
      next: { pathname: string; fullPath: string };
    }) => {
      if (!runActiveRef.current) return false;
      if (next.pathname === "/results" || next.fullPath === "/results") return false;
      // Search-param sync on the same play URL is not leaving.
      if (current.pathname === "/play" && next.pathname === "/play") return false;
      return true;
    },
    [],
  );
  const enableLeaveBeforeUnload = useCallback(() => runActiveRef.current, []);

  const leaveBlocker = useBlocker({
    shouldBlockFn: shouldBlockLeave,
    enableBeforeUnload: enableLeaveBeforeUnload,
    withResolver: true,
  });
  const leavePromptOpen = leaveBlocker.status === "blocked";
  /** Clock freeze for Couch break or leave-run confirm (without opening Couch break UI). */
  const clockPaused = paused || leavePromptOpen;

  /** Misclick grace: discard run, skip results/medals, back to lobby. */
  const bailToLobby = () => {
    finished.current = true;
    runStartedAtRef.current = 0;
    runActiveRef.current = false;
    setPaused(false);
    setState(null);
    leaveBlocker.reset?.();
    navigate({ to: "/" });
  };
  /** Survival: total clock ever granted (start + all refills) so we can derive time survived at the end. */
  const survivalBudgetMsRef = useRef(0);
  /** Goal: wall-clock active play (pause excluded) for Potato Board WPM. */
  const goalElapsedMsRef = useRef(0);
  const goalTickAtRef = useRef<number | null>(null);
  const [survivalBump, setSurvivalBump] = useState<{ id: number; seconds: number } | null>(null);

  const openPause = () => {
    pauseOpensRef.current += 1;
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
    trackOptionsPrefChanged("sfx", next ? "on" : "off");
  };

  const setMenuMusicOn = (next: boolean) => {
    setMenuMusic(next);
    setMenuMusicEnabled(next);
    applyMenuMusicEnabled(next);
    trackOptionsPrefChanged("lobby_jam", next ? "on" : "off");
  };

  const setWordsLeftOn = (next: boolean) => {
    setShowWordsLeftState(next);
    setShowWordsLeft(next);
    trackOptionsPrefChanged("words_left", next ? "show" : "hide");
  };

  const setDarkModeOn = (next: boolean) => {
    const pref = next ? "dark" : "light";
    setThemePref(pref);
    setThemePreference(pref);
    applyTheme(pref);
    trackOptionsPrefChanged("look", pref);
  };

  const celebrateBoardClear = (wordsFound?: number) => {
    if (boardClearedRef.current) return;
    boardClearedRef.current = true;
    track("board_cleared", {
      mode: launch.mode,
      grid: launch.grid,
      topology,
      words: wordsFound ?? 0,
    });
    playBoardClearedSound();
    toast.success("Board cleared. Every word nabbed!");
    setFlash("BOARD CLEARED!");
    window.setTimeout(() => setFlash(""), BOARD_CLEAR_FLASH_MS);
  };

  /** New board + clock from lobby launch prefs. Does not record the abandoned run. */
  const beginFreshRun = async (isStale?: () => boolean) => {
    // Dynamic — keeps ENABLE JSON out of the Play shell chunk (lobby prefetch / LH cold path).
    const { dictionaryWithoutWords, getDictionary } = await import("@couch-potato/dictionary");
    if (isStale?.()) return;
    const dict = dictionaryWithoutWords(getDictionary(), loadDevicePrefs().customBlockedWords);
    dictRef.current = dict;
    const minWordLength = (launch.minWordLength ?? 3) as MinWordLength;
    const difficulty = launch.difficulty ?? "easy";
    const board = generateBoard({
      size: launch.grid,
      dict,
      topology,
      minWordLength,
      difficulty,
    });
    const config: GameConfig =
      launch.mode === "target"
        ? {
            mode: "target" as const,
            difficulty,
            minWordLength,
          }
        : launch.mode === "survival"
          ? {
              mode: "survival" as const,
              difficulty,
              minWordLength,
            }
          : {
              mode: "timed" as const,
              duration: launch.duration ?? 60,
              difficulty,
              minWordLength,
            };
    survivalBudgetMsRef.current =
      config.mode === "survival" ? SURVIVAL_START_SECONDS[config.difficulty] * 1000 : 0;
    goalElapsedMsRef.current = 0;
    goalTickAtRef.current = null;
    finished.current = false;
    boardClearedRef.current = false;
    hudSignalRef.current = null;
    timerUrgencyRef.current = 0;
    setState(createGame(board, config));
    saveBoardSnapshot({
      letters: board.letters,
      topology: board.topology,
      size: board.size,
    });
    runStartedAtRef.current = performance.now();
    secondsToFirstRef.current = null;
    rotatesRef.current = 0;
    pauseOpensRef.current = 0;
    const via = consumePlayVia();
    const sessionRun = nextSessionRun();
    sessionRunRef.current = sessionRun;
    track("game_started", {
      ...launchAnalyticsProps({
        mode: config.mode,
        grid: board.size,
        topology: board.topology,
        minWordLength,
        difficulty: config.difficulty,
        duration: config.mode === "timed" ? config.duration : undefined,
      }),
      via,
      session_run: sessionRun,
      board_words: board.allWords.length,
      board_max_score: board.maxScore,
      banned_words: loadDevicePrefs().customBlockedWords.length,
    });
  };

  const restartRun = () => {
    track("restart_mid_run", {
      ...launchAnalyticsProps(launch),
      session_run: sessionRunRef.current || peekSessionRun(),
    });
    setPlayVia("restart");
    if (rotateFallbackRef.current != null) {
      window.clearTimeout(rotateFallbackRef.current);
      rotateFallbackRef.current = null;
    }
    rotatingRef.current = false;
    setPaused(false);
    setPath([]);
    setFlash("");
    setLastFound(null);
    setFirstWord(true);
    setEndBeat(null);
    setBoardTurnDeg(0);
    setBoardTurning(false);
    setHudPulse(false);
    setSurvivalBump(null);
    // Drop board so PlaySkeleton paints while dict + sync gen hold the thread.
    setState(null);
    window.setTimeout(() => {
      void beginFreshRun();
    }, 0);
  };

  useEffect(() => {
    bind();
    setEnabled(loadDevicePrefs().soundEnabled);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Yield so PlaySkeleton can paint before dict fetch + sync board gen.
    const genId = window.setTimeout(() => {
      void beginFreshRun(() => cancelled);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(genId);
    };
  }, [launch, topology]);

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
    if (!state || state.remainingMs == null || state.ended || clockPaused) return;
    const id = window.setInterval(() => {
      setState((s) => (s ? tickTimer(s, 250) : s));
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.remainingMs == null, state?.ended, clockPaused]);

  // Goal has no engine clock — accumulate wall time while unpaused for WPM.
  useEffect(() => {
    if (!state || state.ended || clockPaused || state.config.mode !== "target") {
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
  }, [state?.ended, clockPaused, state?.config.mode]);

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
    if (celebrate || !state || state.ended || leavePromptOpen) return;
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
  }, [paused, celebrate, state?.ended, state == null, leavePromptOpen]);

  useEffect(() => {
    if (!state?.ended || finished.current) return;
    finished.current = true;
    void finish(state);
  }, [state?.ended]);

  const finish = async (s: GameState) => {
    const profile = getActiveProfile();
    const key = highScoreKey(profile.id, s.board.size, s.config, s.board.topology);
    const difficulty = s.config.difficulty;
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

    const playSeconds = Math.round(activePlayMs / 1000);
    const boardWords = s.board.allWords.length;
    const foundPct =
      boardWords > 0 ? Math.round((1000 * s.found.length) / boardWords) / 10 : 0;
    const longest = s.found.reduce((m, w) => Math.max(m, w.length), 0);
    const avgLen =
      s.found.length > 0
        ? Math.round((10 * s.found.reduce((sum, w) => sum + w.length, 0)) / s.found.length) / 10
        : 0;
    const targetPts = s.target ?? 0;
    const clearedPct =
      targetPts > 0 && s.remaining != null
        ? Math.round(1000 * Math.min(1, Math.max(0, 1 - s.remaining / targetPts))) / 10
        : targetPts > 0
          ? Math.round(1000 * Math.min(1, s.score / targetPts)) / 10
          : null;

    track("game_completed", {
      ...launchAnalyticsProps({
        mode: s.config.mode,
        grid: s.board.size,
        topology: s.board.topology,
        minWordLength: s.config.minWordLength,
        difficulty,
        duration: s.config.mode === "timed" ? s.config.duration : undefined,
      }),
      reason: s.ended!,
      score: s.score,
      words: s.found.length,
      session_run: sessionRunRef.current || peekSessionRun(),
      play_seconds: playSeconds,
      board_words: boardWords,
      board_max_score: s.board.maxScore,
      found_pct: foundPct,
      words_left: Math.max(0, boardWords - s.found.length),
      longest_word: longest,
      avg_word_len: avgLen,
      target: targetPts || null,
      cleared_pct: clearedPct,
      rotates: rotatesRef.current,
      pause_opens: pauseOpensRef.current,
      board_cleared: boardClearedRef.current,
      personal_best: isHigh,
      seconds_to_first_word: secondsToFirstRef.current,
      survival_peak_clock_s:
        s.config.mode === "survival"
          ? Math.round(survivalBudgetMsRef.current / 1000)
          : null,
      survival_bonus_s:
        s.config.mode === "survival"
          ? Math.max(
              0,
              Math.round(survivalBudgetMsRef.current / 1000) -
                SURVIVAL_START_SECONDS[s.config.difficulty],
            )
          : null,
    });

    if (isHigh) {
      track("personal_best", {
        mode: s.config.mode,
        grid: s.board.size,
        score: s.score,
      });
    }
    for (const up of stageUps) {
      track("medal_stage_up", {
        track_id: up.id,
        stage: up.stage,
        milestone: up.milestone,
      });
    }

    const dict = dictRef.current;
    if (!dict) return;
    const missed = missedLongWords(s, dict);
    const missedMore = missedOtherWords(s, missed);
    const detail = formatRunMeta({
      mode: s.config.mode,
      difficulty,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
      minWordLength: s.config.minWordLength,
    });
    saveLastRun({
      score: s.score,
      found: sortWordsByLengthThenAlpha(s.found),
      missed,
      missedMore: missedMore.length ? missedMore : undefined,
      reason: s.ended!,
      mode: s.config.mode,
      grid: s.board.size,
      topology: s.board.topology,
      letters: cloneLetters(s.board.letters),
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

    // Every finish gets the same curtain call (tile drop + confetti + pill), not
    // only Goal wins — timeout/quit are big loop beats too.
    setEndBeat(s.ended!);
    playRunEndSound(s.ended!, { boardAlreadyCleared: boardClearedRef.current });
    await new Promise((r) => window.setTimeout(r, END_FLOURISH_MS));

    navigate({ to: "/results" });
  };

  if (!state) {
    return <PlaySkeleton />;
  }

  const currentWord = wordFromPath(state.board.letters, path).toUpperCase();
  const target = state.target ?? 0;
  const remaining = state.remaining;
  const wordsLeft = state.board.allWords.length - state.found.length;
  const secs = state.remainingMs != null ? Math.ceil(state.remainingMs / 1000) : null;
  const adjacent = (a: Cell, b: Cell) => isAdjacentCells(a, b, state.board.topology);
  const boardLocked = celebrate || boardTurning || paused || leavePromptOpen;
  const challengeBadge = formatRunChallengeBadge({
    mode: state.config.mode,
    difficulty: state.config.difficulty,
    duration: state.config.mode === "timed" ? state.config.duration : undefined,
  });
  const heatProgress =
    remaining != null && target > 0 ? Math.min(1, Math.max(0, 1 - remaining / target)) : 0;
  const heatTier = remaining != null ? hudHeatTier(heatProgress) : 0;
  const timerBaselineSec = timerBaselineSeconds(state.config);
  const timerUrgency =
    secs != null && timerBaselineSec != null ? hudTimerUrgency(secs, timerBaselineSec) : 0;
  const timerTotalMs =
    state.remainingMs == null
      ? 0
      : state.config.mode === "timed"
        ? state.config.duration * 1000
        : Math.max(
            SURVIVAL_START_SECONDS[state.config.difficulty] * 1000,
            survivalBudgetMsRef.current,
            state.remainingMs,
          );
  const hudBubbleClass = [
    "cp-hud-bubble",
    heatTier > 0 ? `cp-hud-heat-${heatTier}` : "",
    hudPulse ? "is-pulsing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const applyRotate = (steps: 1 | -1) => {
    setState((s) => {
      if (!s) return s;
      const board = rotateBoard(s.board, steps);
      saveBoardSnapshot({
        letters: board.letters,
        topology: board.topology,
        size: board.size,
      });
      return { ...s, board };
    });
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
    if (celebrate || paused || leavePromptOpen || rotatingRef.current) return;
    rotatesRef.current += 1;
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
    <Shell className="relative overflow-hidden cp-shell-play cp-fade-up">
      <ConfettiBurst active={celebrate} durationMs={END_FLOURISH_MS} />

      {/* HUD: never cram Goal remaining + Easy + pause on one narrow row (pill was wrapping into a
          circle under Absolute Easy). Score | pause on top; mode badge centered below. */}
      <div className="cp-play-hud mb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="shrink-0">
            {/* `.cp-hud-bubble` already bakes in font-display/size/weight — the
                text just needs to inherit color (bubble sets it per heat tier). */}
            {remaining != null ? (
              <div className={hudBubbleClass} aria-label={`${remaining} points left to clear`}>
                <span style={{ color: "inherit" }}>{remaining} points left</span>
              </div>
            ) : secs != null && state.remainingMs != null ? (
              <div className="relative shrink-0">
                <TimerRing
                  remainingMs={state.remainingMs}
                  totalMs={timerTotalMs}
                  urgency={timerUrgency}
                  pulsing={hudPulse}
                />
                {survivalBump ? (
                  <span
                    key={survivalBump.id}
                    className="cp-survival-bump-anchor"
                    aria-label={`Plus ${survivalBump.seconds} seconds`}
                  >
                    <span className="cp-survival-bump cp-catch-in" aria-hidden>
                      +{survivalBump.seconds}s
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="shrink-0">
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
          </div>
        </div>
        <div className="flex justify-center">
          <div
            className="cp-run-badge gap-1.5"
            aria-label={`${state.config.mode === "target" ? "Goal" : state.config.mode === "timed" ? "Timed" : "Survival"} · ${challengeBadge}`}
          >
            <ModeGlyph mode={state.config.mode} className="size-3.5 shrink-0" />
            <span style={{ color: "inherit" }}>{challengeBadge}</span>
          </div>
        </div>
      </div>

      {showWordsLeft ? (
        <p
          className="mb-2 text-center font-display text-sm font-semibold text-muted-foreground"
          aria-label={`${wordsLeft} words left on the board`}
        >
          {wordsLeft} {wordsLeft === 1 ? "word" : "words"} left
        </p>
      ) : null}

      {remaining != null && target > 0 && (
        <ProgressBar value={remaining} max={target} className="mb-3" />
      )}

      <ScoreBubble
        word={endBeat ? runEndPill(endBeat, state.config.mode) : currentWord || flash}
        hint={`Start swiping · ${state.config.minWordLength}+`}
        className="mb-3"
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
                const dict = dictRef.current;
                if (!dict) return;
                const { state: next, result } = submitPath(state, p, dict);
                setPath([]);
                if (result.ok) {
                  const first = firstWord;
                  if (first && runStartedAtRef.current > 0) {
                    secondsToFirstRef.current = Math.round(
                      (performance.now() - runStartedAtRef.current) / 1000,
                    );
                  }
                  track("word_found", {
                    word: result.word,
                    points: result.points,
                    length: result.word.length,
                    first,
                    seconds_to_first_word: first ? secondsToFirstRef.current : null,
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
                    celebrateBoardClear(next.found.length);
                  } else {
                    playAcceptedWordSound(result.word.length, { firstWord });
                    setFlash(result.word.toUpperCase());
                    window.setTimeout(() => setFlash(""), 700);
                  }
                  setFirstWord(false);
                  setState(next);
                } else if (isRejectedWordSubmit(result.reason)) {
                  trackWordRejected(result.reason);
                  playRejectedWordSound();
                  setFlash(REJECT_FLASH[result.reason] ?? result.reason);
                  window.setTimeout(() => setFlash(""), 700);
                }
              }
        }
      />

      {/* Last catch sits above spins — never between them (8+ letter words crushed the
          middle slot). Spins are a simple centered pair. */}
      <div
        className={cn(
          "mt-3 flex w-full shrink-0 items-center justify-center",
          lastFound ? "min-h-11" : "min-h-0",
        )}
      >
        {lastFound ? (
          <div key={lastFound.id} className="cp-last-found cp-catch-in max-w-full" role="status">
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

      <div className="cp-play-board-actions mt-1.5 flex w-full shrink-0 items-center justify-center gap-2 sm:mt-2">
        <IconTooltip label="Spin board left">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 shrink-0 gap-1 px-2.5 font-body"
            disabled={boardLocked}
            onClick={() => rotate(-1)}
            aria-label="Spin board left"
            data-testid="rotate-ccw"
          >
            <RotateCcwSquare className="size-4 shrink-0" aria-hidden />
            <span className="font-body text-[0.65rem] font-bold uppercase tracking-wide">Spin</span>
          </Button>
        </IconTooltip>

        <IconTooltip label="Spin board right">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 shrink-0 gap-1 px-2.5 font-body"
            disabled={boardLocked}
            onClick={() => rotate(1)}
            aria-label="Spin board right"
            data-testid="rotate-cw"
          >
            <span className="font-body text-[0.65rem] font-bold uppercase tracking-wide">Spin</span>
            <RotateCwSquare className="size-4 shrink-0" aria-hidden />
          </Button>
        </IconTooltip>
      </div>

      <Dialog
        open={leavePromptOpen}
        onOpenChange={(open) => {
          if (!open) leaveBlocker.reset?.();
        }}
      >
        <DialogContent
          showClose={false}
          className="gap-3"
          data-testid="leave-run-guard"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            leaveBlocker.reset?.();
          }}
        >
          <DialogHeader>
            <DialogTitle>Leave this run?</DialogTitle>
            <DialogDescription>
              Walking away dumps this haul. No results, no medals tick. Use End run from Couch break
              if you want to keep the score.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="min-w-0 flex-1 justify-center sm:flex-none"
              data-testid="leave-run-stay"
              onClick={() => leaveBlocker.reset?.()}
            >
              Keep playing
            </Button>
            <Button
              variant="ghost"
              className="cp-end-run-btn min-w-0 flex-1 justify-center gap-2 sm:flex-none"
              data-testid="leave-run-confirm"
              onClick={() => {
                if (isEarlyBail()) {
                  bailToLobby();
                  return;
                }
                leaveBlocker.proceed?.();
              }}
            >
              Leave run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              label="Sound effects"
              value={sound ? "on" : "off"}
              onChange={(v) => setSoundOn(v === "on")}
              data-testid="pause-sfx"
              options={[
                { value: "off", label: "Off", Icon: VolumeX },
                { value: "on", label: "On", Icon: Volume2 },
              ]}
            />
            <PrefChoiceGroup
              label="Couch jam"
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
                { value: "light", label: "Light", Icon: Sun },
                { value: "dark", label: "Dark", Icon: Moon },
              ]}
            />
            <div className="mt-1 flex flex-col gap-2 border-t-2 border-border pt-3 sm:flex-row sm:items-stretch">
              <Button
                variant="ghost"
                className="cp-end-run-btn order-2 min-w-0 w-full flex-1 justify-center gap-2 sm:order-1 sm:w-auto"
                data-testid="end-run"
                onClick={() => {
                  if (isEarlyBail()) {
                    bailToLobby();
                    return;
                  }
                  closePause();
                  setState(quitGame(state));
                }}
              >
                <CircleStop className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
                End run
              </Button>
              <Button
                variant="outline"
                className="order-3 min-w-0 w-full flex-1 justify-center gap-2 sm:order-2 sm:w-auto"
                data-testid="restart-run"
                onClick={restartRun}
              >
                <RotateCcw className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
                Restart
              </Button>
              <Button
                data-pause-resume
                className="order-1 w-full justify-center gap-2 sm:order-3 sm:w-auto sm:min-w-0 sm:flex-[1.15]"
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
