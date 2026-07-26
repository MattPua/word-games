import { useNavigate, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { BrandHeader, EmptyState, PotatoSprite, ScrollShell } from "@couch-potato/ui";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { captureError } from "../analytics";

/** Unexpected failure — potato spilled the snacks. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const reported = useRef<unknown>(null);

  useEffect(() => {
    if (!error || reported.current === error) return;
    reported.current = error;
    captureError(error, { surface: "router_error" });
  }, [error]);

  return (
    <ScrollShell>
      {/* Top-aligned — never vertically center short chrome (huge empty tops). */}
      <BrandHeader
        className="cp-fade-up"
        mark={<PotatoSprite frame="idle" size={96} />}
        title="500"
      />
      <EmptyState
        title="Snack spill in aisle potato"
        body="Something unexpected flopped. Shake the crumbs off and try again."
        className="mt-2 cp-fade-up cp-stagger-2"
      />
      {import.meta.env.DEV && error?.message ? (
        <span className="mb-4 max-w-sm text-center font-body text-xs text-muted-foreground">
          {error.message}
        </span>
      ) : null}
      <Button
        className="mb-2 cp-chrome-cta"
        onClick={() => {
          reset?.();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
      <Button variant="secondary" className="cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
