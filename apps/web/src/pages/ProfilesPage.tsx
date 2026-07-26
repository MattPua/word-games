import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Medal, Pencil, Sofa, UserPlus, UserRound } from "lucide-react";
import { EmptyState, ScrollShell } from "@couch-potato/ui";
import { PotatoBoard } from "../components/PotatoBoard";
import { allTrackProgress, withGamesPlayed } from "../achievements";
import {
  createProfile,
  getActiveProfile,
  loadStore,
  renameProfile,
  setActiveProfile,
} from "../storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ChromeTopBar";
import { Input } from "@/components/ui/input";

export function ProfilesPage() {
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const store = loadStore();
  const active = getActiveProfile();
  const [name, setName] = useState("");
  const medalsEarned = allTrackProgress(
    withGamesPlayed(active.achievements, active.gamesPlayed),
  ).reduce((sum, p) => sum + p.stage, 0);

  return (
    <ScrollShell shellClassName="cp-shell-crew cp-crew cp-fade-up">
      <PageHeading
        title="Couch crew"
        description="Every spud, their scores, one shared couch."
      />

      <div className="cp-crew-columns mb-5 flex flex-col gap-5">
        <div className="cp-fade-up cp-stagger-1">
          {store.profiles.length === 0 ? (
            <EmptyState title="Nobody on the couch" body="Add a spud so high scores have a home." />
          ) : (
            store.profiles.map((p) => {
              const isActive = p.id === active.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "cp-lobby-card mb-2.5 flex flex-row items-center justify-between gap-3 p-3.5",
                    isActive && "cp-lobby-card-active cp-select-pop",
                  )}
                >
                  <div className="min-w-0 flex-1 flex flex-row items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <UserRound className="size-5" strokeWidth={2.25} aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-display text-base font-bold text-foreground">
                        {p.name}
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {p.gamesPlayed} runs · {p.wordsFound} words
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    disabled={isActive}
                    onClick={() => {
                      setActiveProfile(p.id);
                      refresh();
                    }}
                  >
                    {isActive ? (
                      <>
                        <Check className="size-3.5" aria-hidden />
                        Seated
                      </>
                    ) : (
                      "Sit here"
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4 cp-fade-up cp-stagger-1">
          <button
            type="button"
            onClick={() => navigate({ to: "/achievements" })}
            className="cp-lobby-card flex w-full items-center justify-between gap-3 p-3.5 text-left"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-secondary">
                <Medal className="cp-lobby-glyph size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-sm font-bold text-foreground">Couch medals</span>
                <span className="font-body text-xs text-muted-foreground">
                  {medalsEarned > 0
                    ? `${medalsEarned} medal${medalsEarned === 1 ? "" : "s"} earned. See the full haul`
                    : "No medals yet. Play a round to start the pile"}
                </span>
              </span>
            </span>
            <ChevronRight
              className="cp-lobby-glyph size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="cp-fade-up cp-stagger-2">
        <PotatoBoard profile={active} />
      </div>

      <div className="mb-2 cp-fade-up cp-stagger-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your spud"
          className="mb-2"
        />
        <div className="flex flex-row gap-2">
          <Button
            className="flex-1 gap-1.5"
            onClick={() => {
              createProfile(name);
              setName("");
              refresh();
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            Add to crew
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => {
              if (!name.trim()) return;
              renameProfile(active.id, name);
              setName("");
              refresh();
            }}
          >
            <Pencil className="size-4" aria-hidden />
            Rename seated
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        className="cp-chrome-cta cp-fade-up cp-stagger-3"
        onClick={() => navigate({ to: "/" })}
      >
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
