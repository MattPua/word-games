import { Music2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LobbyJamInviteProps = {
  onCue: () => void;
  onDismiss: () => void;
  className?: string;
};

/**
 * Quiet Couch jam (BGM) nudge under Customize your game — never a hero banner.
 * Hidden once jam is on or the invite was dismissed.
 */
export function LobbyJamInvite({ onCue, onDismiss, className }: LobbyJamInviteProps) {
  return (
    <aside
      className={cn(
        "cp-lobby-jam-invite flex flex-col gap-2.5 p-3",
        className,
      )}
      data-testid="lobby-jam-invite"
      aria-label="Couch jam invite"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="cp-lobby-glyph shrink-0 text-muted-foreground" aria-hidden>
          <Music2 className="size-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="font-display text-xs font-bold text-foreground">Couch jam</p>
          <p className="font-body text-[0.7rem] leading-snug text-muted-foreground">
            Optional chill bed while you set up and play. Mute anytime in Options.
          </p>
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          className="cp-lobby-jam-cue h-8 px-2.5 text-xs"
          data-testid="lobby-jam-invite-cue"
          onClick={onCue}
        >
          Cue the jam
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground"
          data-testid="lobby-jam-invite-dismiss"
          onClick={onDismiss}
        >
          <X className="size-3.5 shrink-0" aria-hidden />
          Later
        </Button>
      </div>
    </aside>
  );
}
