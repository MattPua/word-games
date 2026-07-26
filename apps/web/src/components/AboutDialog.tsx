import { useEffect, useState } from "react";
import { PotatoWaveSvg } from "@couch-potato/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ABOUT_OPEN, consumeAboutWantOpen } from "../aboutBus";
import {
  GITHUB_ISSUE_URL,
  GITHUB_REPO_URL,
  GitHubGlyph,
  X_PROFILE_URL,
  XGlyph,
} from "../socialLinks";

/** Credits + feedback — chrome About + ⌘K, not a full route. */
export function AboutDialog() {
  const [open, setOpen] = useState(() => consumeAboutWantOpen());

  useEffect(() => {
    const onBus = () => setOpen(true);
    window.addEventListener(ABOUT_OPEN, onBus);
    return () => window.removeEventListener(ABOUT_OPEN, onBus);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-4 sm:max-w-sm" closeLabel="Close">
        {/* pr-0: default DialogHeader pr-8 clears the X and shifts centered About left */}
        <DialogHeader className="items-center pr-0 text-center sm:items-center sm:text-center">
          <PotatoWaveSvg size={72} className="mx-auto mb-1" />
          <DialogTitle>About</DialogTitle>
          <DialogDescription className="text-balance">
            My girlfriend and I love word games, but we wanted one without ads. So we made this for
            swiping on the couch together. Free and open source. Bug, idea, or just a hi? Ping me on
            X or open a GitHub issue.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto flex w-full max-w-[16rem] flex-col items-stretch gap-2">
          <Button variant="secondary" className="w-full gap-2" asChild>
            <a href={X_PROFILE_URL} target="_blank" rel="noopener noreferrer">
              <XGlyph className="size-4 shrink-0" />
              Message on X
            </a>
          </Button>
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={GITHUB_ISSUE_URL} target="_blank" rel="noopener noreferrer">
              <GitHubGlyph className="size-4 shrink-0" />
              Leave a GitHub issue
            </a>
          </Button>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" asChild>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              <GitHubGlyph className="size-4 shrink-0" />
              Source on GitHub
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
