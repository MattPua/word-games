import { Music2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LobbyJamInviteProps = {
  onCue: () => void;
  onDismiss: () => void;
  className?: string;
};

/**
 * Soft lobby nudge for Lobby jam — fun, one-shot, never blocks Play.
 * Hidden once jam is on or the invite was dismissed.
 */
export function LobbyJamInvite({ onCue, onDismiss, className }: LobbyJamInviteProps) {
  return (
    <aside
      className={cn(
        "cp-lobby-card cp-lobby-jam-invite mb-4 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
      data-testid="lobby-jam-invite"
      aria-label="Lobby jam invite"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="cp-lobby-glyph shrink-0 text-secondary" aria-hidden>
          <Music2 className="cp-icon-anim-note size-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="font-display text-sm font-bold text-foreground">Couch needs a soundtrack</p>
          <p className="font-body text-xs leading-snug text-muted-foreground">
            Drop a chill lobby jam while you pick your run. Totally optional. Mute anytime in
            Options.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-end gap-2 sm:flex-col sm:items-stretch md:flex-row">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          data-testid="lobby-jam-invite-cue"
          onClick={onCue}
        >
          <Music2 className="size-3.5 shrink-0" aria-hidden />
          Cue the jam
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          data-testid="lobby-jam-invite-dismiss"
          onClick={onDismiss}
        >
          <X className="size-3.5 shrink-0" aria-hidden />
          Maybe later
        </Button>
      </div>
    </aside>
  );
}
