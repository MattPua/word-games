import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CirclePlay, Sofa } from "lucide-react";
import {
  BrandHeader,
  LetterGrid,
  PotatoGoSvg,
  PotatoSnoreSvg,
  ScoreBubble,
  Shell,
  type Cell,
} from "@couch-potato/ui";
import { isAdjacentCells, scoreWord, wordFromPath } from "@couch-potato/game-engine";
import { Button } from "@/components/ui/button";
import { setHowToSeen, loadLaunch } from "../storage";
import { playSearchFromLaunch } from "../playLaunchSearch";

/**
 * Fixed 4×4 demo board — CAT (row), DOG (turn), GOLD (reuse), LONGEST (haul).
 * Letters stay put across steps so reuse across words is obvious.
 */
const DEMO_LETTERS: string[][] = [
  ["C", "A", "T", "E"],
  ["R", "O", "G", "S"],
  ["D", "L", "N", "I"],
  ["P", "U", "M", "B"],
];

type HowToStep = {
  id: string;
  title: string;
  body: string;
  target: string;
  path: Cell[];
  hint: string;
  /** When set, success flash shows points (longer-words lesson). */
  showPoints?: boolean;
};

const STEPS: HowToStep[] = [
  {
    id: "straight",
    title: "Swipe a word",
    body: "Drag through neighbors. No jumping, no reuse in one swipe.",
    target: "cat",
    path: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    hint: "Try CAT",
  },
  {
    id: "turn",
    title: "Turn corners",
    body: "Diagonals count on a square board. Change direction mid-swipe.",
    target: "dog",
    path: [
      { row: 2, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
    hint: "Try DOG",
  },
  {
    id: "reuse",
    title: "Tiles stick around",
    body: "Same letters, new haul. Release to score, then swipe again.",
    target: "gold",
    path: [
      { row: 1, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ],
    hint: "Try GOLD",
  },
  {
    id: "longer",
    title: "Go long for points",
    body: "Longer words pay more. Points = letters minus 2, so 7 letters is 5 pts.",
    target: "longest",
    path: [
      { row: 2, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 1, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 0, col: 2 },
    ],
    hint: "Try LONGEST (7 letters, 5 pts)",
    showPoints: true,
  },
];

const DEMO_MS = 320;

/**
 * Interactive how-to — brief swipe coach on a fixed board.
 * Device pref `howToSeen`; Options can clear it to replay.
 */
export function HowToPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [path, setPath] = useState<Cell[]>([]);
  const [flash, setFlash] = useState("");
  const [demoing, setDemoing] = useState(true);
  const [done, setDone] = useState(false);
  const [firstCatch, setFirstCatch] = useState(true);
  const demoGen = useRef(0);

  const step = STEPS[stepIndex]!;
  const liveWord = wordFromPath(DEMO_LETTERS, path).toUpperCase();

  const finish = useCallback(() => {
    setHowToSeen(true);
    navigate({ to: "/" });
  }, [navigate]);

  /** Done CTA — straight into a run with last lobby prefs (game loop). */
  const startRun = useCallback(() => {
    setHowToSeen(true);
    navigate({ to: "/play", search: playSearchFromLaunch(loadLaunch()) });
  }, [navigate]);

  // Ghost-swipe the target path once when a step opens, then hand the board over.
  useEffect(() => {
    if (done) return;
    const gen = ++demoGen.current;
    setPath([]);
    setFlash("");
    setDemoing(true);
    let i = 0;
    const id = window.setInterval(() => {
      if (gen !== demoGen.current) return;
      i += 1;
      if (i > step.path.length) {
        window.clearInterval(id);
        setPath([]);
        setDemoing(false);
        return;
      }
      setPath(step.path.slice(0, i));
    }, DEMO_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [stepIndex, step.path, done]);

  const onPathEnd = (finalPath: Cell[]) => {
    if (demoing || done) return;
    const word = wordFromPath(DEMO_LETTERS, finalPath).toLowerCase();
    setPath([]);
    if (word === step.target) {
      void import("../wordAcceptSound").then((m) =>
        m.playAcceptedWordSound(word.length, { firstWord: firstCatch }),
      );
      setFirstCatch(false);
      const pts = scoreWord(word.length);
      setFlash(step.showPoints ? `${word.toUpperCase()} +${pts}` : word.toUpperCase());
      window.setTimeout(() => {
        setFlash("");
        if (stepIndex >= STEPS.length - 1) {
          setDone(true);
        } else {
          setStepIndex((n) => n + 1);
        }
      }, 650);
      return;
    }
    if (word.length >= 3) {
      void import("../wordRejectSound").then((m) => m.playRejectedWordSound());
      setFlash(word === "" ? "" : "Not that one");
      window.setTimeout(() => setFlash(""), 900);
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col cp-fade-up">
      <div className="cp-shell-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
        <Shell className="cp-shell-howto !h-auto min-h-full !flex-none max-w-md">
          <BrandHeader
            className="mb-3"
            mark={done ? <PotatoGoSvg size={72} /> : <PotatoSnoreSvg size={64} />}
            title={done ? "Let's go" : "How to play"}
            description={
              done ? "Short sessions. No hints. Nab a haul." : `${stepIndex + 1} of ${STEPS.length}`
            }
          />

          {done ? (
            <div className="space-y-4 text-center" data-testid="howto-done">
              <div className="space-y-2">
                <p className="font-body text-base text-foreground">
                  You know the swipe. Time for a real haul.
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  Replay anytime from Options.
                </p>
              </div>
              {/* CTA hugs copy — not a viewport-bottom sticky bar (huge empty middle). */}
              <div className="cp-lobby-play !border-0 !bg-transparent !pb-2 !pt-1 !shadow-none">
                <div className="cp-lobby-play-inner flex justify-center">
                  <Button
                    size="lg"
                    className="cp-play-cta cp-chrome-cta min-w-0 gap-2.5 text-lg"
                    onClick={startRun}
                    data-testid="howto-play-run"
                  >
                    <CirclePlay className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
                    Play a run
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-1" data-testid="howto-coach">
              <h2 className="font-display text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="font-body text-sm text-muted-foreground">{step.body}</p>
            </div>
          )}

          {!done ? (
            <>
              <ScoreBubble
                className="mb-3"
                word={flash || liveWord}
                hint={demoing ? "Watch…" : step.hint}
              />
              <div
                className={`cp-howto-board mx-auto w-full ${demoing ? "cp-howto-demoing" : ""}`}
                data-testid="howto-board"
              >
                <LetterGrid
                  letters={DEMO_LETTERS}
                  selected={path}
                  topology="square"
                  isAdjacent={(a, b) => isAdjacentCells(a, b, "square")}
                  interactive={!demoing}
                  onPathChange={setPath}
                  onPathEnd={onPathEnd}
                />
              </div>
            </>
          ) : null}
        </Shell>
      </div>

      {!done ? (
        <div className="w-full shrink-0">
          <Shell className="cp-shell-howto !h-auto !flex-none max-w-md pb-0 pt-0">
            <div className="cp-lobby-play shrink-0">
              <div className="cp-lobby-play-inner flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-0 flex-1 sm:flex-none"
                  onClick={finish}
                  data-testid="howto-skip"
                >
                  <Sofa className="size-4 shrink-0" aria-hidden />
                  Skip
                </Button>
                <p className="min-w-0 flex-1 text-center font-body text-xs text-muted-foreground sm:text-left">
                  {demoing ? "Ghost swipe first…" : "Your turn. Swipe the word."}
                </p>
              </div>
            </div>
          </Shell>
        </div>
      ) : null}
    </div>
  );
}
