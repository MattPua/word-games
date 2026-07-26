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

const X_URL = "https://x.com/yo_puaaa";
const GITHUB_URL = "https://github.com/MattPua/A-Couch-Potato";

/** Tiny credits modal — chrome About + ⌘K, not a full route. */
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
            swiping on the couch together. Free and open source.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto flex w-full max-w-[16rem] flex-col items-stretch gap-2">
          <Button variant="secondary" className="w-full gap-2" asChild>
            <a href={X_URL} target="_blank" rel="noopener noreferrer">
              <XGlyph className="size-4 shrink-0" />
              @yo_puaaa
            </a>
          </Button>
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GitHubGlyph className="size-4 shrink-0" />
              Source on GitHub
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function XGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.828L1.254 2.25H8.08l4.257 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function GitHubGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
