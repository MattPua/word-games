import { HeartHandshake, Medal, Settings, Sofa, Users, type LucideIcon } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { IconTooltip } from "@/components/ui/tooltip";
import { openAbout } from "../aboutBus";
import { isApplePlatform, modKLabel, openCommandPalette } from "../commandPaletteBus";

const LINKS: {
  to: "/achievements" | "/profiles" | "/options";
  label: string;
  Icon: LucideIcon;
  anim: string;
}[] = [
  { to: "/achievements", label: "Couch medals", Icon: Medal, anim: "cp-icon-anim-medal" },
  { to: "/profiles", label: "Couch crew", Icon: Users, anim: "cp-icon-anim-crew" },
  { to: "/options", label: "Options", Icon: Settings, anim: "cp-icon-anim-gear" },
];

/** Lobby + chrome-page header nav — active route gets potato fill + glyph motion. */
export function ChromeNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onLobby = pathname === "/";
  const jumpHint = modKLabel();
  const apple = isApplePlatform();

  return (
    <div
      className="flex shrink-0 flex-row items-center gap-2"
      role="navigation"
      aria-label="Main menu"
    >
      {!onLobby ? (
        <IconTooltip label="Back to lobby">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to lobby"
            data-nav="lobby"
            onClick={() => navigate({ to: "/" })}
          >
            <Sofa className="cp-icon-anim-sofa" fillOpacity={0} />
          </Button>
        </IconTooltip>
      ) : null}
      {LINKS.map(({ to, label, Icon, anim }) => {
        const active = pathname === to;
        return (
          <IconTooltip key={to} label={label}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-active={active ? "true" : undefined}
              data-nav={to.slice(1)}
              onClick={() => navigate({ to })}
            >
              <Icon className={anim} fillOpacity={active ? 0.22 : 0} />
            </Button>
          </IconTooltip>
        );
      })}
      <IconTooltip label="About">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="About"
          data-nav="about"
          onClick={() => openAbout()}
        >
          <HeartHandshake className="cp-icon-anim-about" fillOpacity={0} />
        </Button>
      </IconTooltip>
      {/* Quiet md+ palette affordance — after icons so Lobby sofa stays leftmost. */}
      <IconTooltip label={`Jump menu · ${jumpHint}`}>
        <button
          type="button"
          data-nav="command-palette"
          className="ml-0.5 hidden h-9 items-center rounded-ui px-1.5 opacity-55 transition-[opacity,background-color] duration-150 hover:bg-muted/70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          aria-label={`Jump menu, ${jumpHint}`}
          onClick={() => openCommandPalette()}
        >
          <KbdGroup aria-hidden>
            {apple ? <Kbd>⌘</Kbd> : <Kbd>Ctrl</Kbd>}
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>
      </IconTooltip>
    </div>
  );
}
