import { Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  missedLongWords,
  quitGame,
  sortWordsByLengthThenAlpha,
  submitPath,
  tickTimer,
  wordFromPath,
  type GameState,
  type MinWordLength,
} from "@couch-potato/game-engine";
import { play } from "cuelume";
import { track } from "../analytics";
import {
  getActiveProfile,
  loadLaunch,
  recordFinishedRun,
  saveLastRun,
} from "../storage";
import { Button } from "@/components/ui/button";

const WIN_FLOURISH_MS = 1300;

export function PlayPage() {
  const navigate = useNavigate();
  const dict = useMemo(() => getDictionary(), []);
  const launch = useMemo(() => loadLaunch(), []);
  const [state, setState] = useState<GameState | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const [flash, setFlash] = useState("");
  const [firstWord, setFirstWord] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    const minWordLength = (launch.minWordLength ?? 3) as MinWordLength;
    const board = generateBoard({
      size: launch.grid,
      dict,
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
  }, [dict, launch]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __cpForceWin?: () => void }).__cpForceWin = () => {
      setState((s) =>
        s
          ? {
              ...s,
              score: Math.max(s.score, s.target ?? s.score),
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
    const key = highScoreKey(profile.id, s.board.size, s.config);
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
  const target = state.target ?? 0;
  const secs =
    state.remainingMs != null ? Math.ceil(state.remainingMs / 1000) : null;

  return (
    <Shell className="relative overflow-hidden">
      <ConfettiBurst active={celebrate} durationMs={WIN_FLOURISH_MS} />
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-display text-xl text-foreground">
          {state.score}
          {state.target != null ? ` / ${state.target}` : ""}
        </Text>
        {secs != null && (
          <Text className="font-display text-xl text-foreground">{secs}s</Text>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={celebrate}
          onClick={() => setState(quitGame(state))}
        >
          Quit
        </Button>
      </View>

      {state.target != null && (
        <ProgressBar value={state.score} max={target} className="mb-3" />
      )}

      <ScoreBubble
        word={celebrate ? "Couch clear!" : currentWord || flash}
        hint={`${state.config.minWordLength}+ letters`}
        className="mb-3"
      />

      <LetterGrid
        letters={state.board.letters}
        selected={celebrate ? [] : path}
        dropping={celebrate}
        onPathChange={celebrate ? undefined : setPath}
        onPathEnd={
          celebrate
            ? undefined
            : (p) => {
                const { state: next, result } = submitPath(state, p, dict);
                setPath([]);
                if (result.ok) {
                  track("word_found", {
                    word: result.word,
                    points: result.points,
                  });
                  play(firstWord ? "sparkle" : "success");
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
    </Shell>
  );
}
