import { Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
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
import { track } from "../analytics";
import {
  getActiveProfile,
  loadDevicePrefs,
  loadLaunch,
  recordFinishedRun,
  saveLastRun,
  setSoundEnabled,
} from "../storage";
import { playAcceptedWordSound } from "../wordAcceptSound";
import { Button } from "@/components/ui/button";

const WIN_FLOURISH_MS = 1300;

export function PlayPage() {
  const navigate = useNavigate();
  const dict = useMemo(() => getDictionary(), []);
  const launch = useMemo(() => loadLaunch(), []);
  const topology = (launch.topology ?? "square") as GridTopology;
  const [state, setState] = useState<GameState | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const [flash, setFlash] = useState("");
  const [firstWord, setFirstWord] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [sound, setSound] = useState(loadDevicePrefs().soundEnabled);
  const [boardTurnDeg, setBoardTurnDeg] = useState(0);
  const [boardTurning, setBoardTurning] = useState(false);
  const finished = useRef(false);
  const rotatingRef = useRef(false);
  const rotateFallbackRef = useRef<number | null>(null);
  const rotateStepsRef = useRef<1 | -1>(1);

  useEffect(() => {
    const minWordLength = (launch.minWordLength ?? 3) as MinWordLength;
    const board = generateBoard({
      size: launch.grid,
      dict,
      topology,
      minWordLength,
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
    (window as unknown as { __cpForceWin?: () => void }).__cpForceWin = () => {
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
    return () => {
      delete (window as unknown as { __cpForceWin?: () => void }).__cpForceWin;
    };
  }, []);

  useEffect(() => {
    if (!state || state.config.mode !== "timed" || state.ended) return;
    const id = window.setInterval(() => {
      setState((s) => (s ? tickTimer(s, 250) : s));
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.config.mode, state?.ended]);

  useEffect(() => {
    if (!state?.ended || finished.current) return;
    finished.current = true;
    void finish(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      difficulty:
        s.config.mode === "target" ? s.config.difficulty : undefined,
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
      difficulty:
        s.config.mode === "target" ? s.config.difficulty : undefined,
      duration: s.config.mode === "timed" ? s.config.duration : undefined,
    });
    track("game_completed", {
      reason: s.ended!,
      score: s.score,
      words: s.found.length,
    });

    if (s.ended === "won") {
      setCelebrate(true);
      play("bloom");
      window.setTimeout(() => play("sparkle"), 180);
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
  const secs =
    state.remainingMs != null ? Math.ceil(state.remainingMs / 1000) : null;
  const adjacent = (a: Cell, b: Cell) =>
    isAdjacentCells(a, b, state.board.topology);

  const applyRotate = (steps: 1 | -1) => {
    setState((s) => (s ? { ...s, board: rotateBoard(s.board, steps) } : s));
    play("ready");
  };

  const clearRotateFallback = () => {
    if (rotateFallbackRef.current == null) return;
    window.clearTimeout(rotateFallbackRef.current);
    rotateFallbackRef.current = null;
  };

  const finishBoardTurn = () => {
    if (!rotatingRef.current) return;
    const steps = rotateStepsRef.current;
    clearRotateFallback();
    applyRotate(steps);
    rotatingRef.current = false;
    rotateStepsRef.current = 1;
    setBoardTurning(false);
    setBoardTurnDeg(0);
  };

  const rotate = (dir: 1 | -1) => {
    if (celebrate || rotatingRef.current) return;
    setPath([]);
    const stepDeg = dir * 90;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      applyRotate(dir);
      return;
    }
    rotatingRef.current = true;
    rotateStepsRef.current = dir;
    setBoardTurning(true);
    // Ensure the browser applies `is-turning` before the angle changes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBoardTurnDeg(stepDeg));
    });
    // Fallback if transitionend is skipped (tab background, etc.).
    clearRotateFallback();
    rotateFallbackRef.current = window.setTimeout(() => {
      if (rotatingRef.current) finishBoardTurn();
    }, 520);
  };

  return (
    <Shell className="relative overflow-hidden cp-fade-up">
      <ConfettiBurst active={celebrate} durationMs={WIN_FLOURISH_MS} />

      <View className="mb-4 flex-row items-center justify-between gap-2">
        {remaining != null ? (
          <View className="cp-hud-bubble">
            <Text className="font-display text-lg font-bold text-foreground">
              {remaining} left
            </Text>
          </View>
        ) : (
          <View className="cp-hud-bubble">
            <Text className="font-display text-lg font-bold text-foreground">
              {state.score}
            </Text>
          </View>
        )}
        {secs != null ? (
          <View className="cp-hud-bubble">
            <Text className="font-display text-lg font-bold text-foreground">
              {secs}s
            </Text>
          </View>
        ) : (
          <View className="cp-hud-bubble min-w-[4.5rem]">
            <Text className="font-display text-lg font-bold text-potato">
              {state.score}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={celebrate}
            aria-pressed={!sound}
            aria-label={sound ? "Mute sound" : "Unmute sound"}
            title={sound ? "Mute sound" : "Unmute sound"}
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
              setEnabled(next);
            }}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={celebrate}
            onClick={() => setState(quitGame(state))}
          >
            Quit
          </Button>
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
        selected={celebrate || boardTurning ? [] : path}
        dropping={celebrate}
        boardTurnDeg={boardTurnDeg}
        boardTurning={boardTurning}
        interactive={!celebrate && !boardTurning}
        onBoardTurnEnd={finishBoardTurn}
        onPathChange={celebrate || boardTurning ? undefined : setPath}
        onPathEnd={
          celebrate || boardTurning
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
                  playAcceptedWordSound(result.word.length, { firstWord });
                  setFirstWord(false);
                  setFlash(result.word.toUpperCase());
                  setState(next);
                } else if (
                  result.reason !== "bad_path" &&
                  result.reason !== "ended"
                ) {
                  play("error");
                  setFlash(result.reason);
                }
                window.setTimeout(() => setFlash(""), 700);
              }
        }
      />

      <div className="mt-4 flex w-full justify-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          disabled={celebrate || boardTurning}
          onClick={() => rotate(-1)}
          aria-label="Rotate board counter-clockwise"
          title="Rotate left"
          data-testid="rotate-ccw"
        >
          <RotateCcw className="size-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={celebrate || boardTurning}
          onClick={() => rotate(1)}
          aria-label="Rotate board clockwise"
          title="Rotate right"
          data-testid="rotate-cw"
        >
          <RotateCw className="size-5" />
        </Button>
      </div>
    </Shell>
  );
}
