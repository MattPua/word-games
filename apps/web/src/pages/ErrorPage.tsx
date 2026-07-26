import { Text } from "react-native";
import { useNavigate, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { BrandHeader, EmptyState, PotatoSprite, ScrollShell } from "@couch-potato/ui";
import { Button } from "@/components/ui/button";

/** Unexpected failure — potato spilled the snacks. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const router = useRouter();

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
        <Text className="mb-4 max-w-sm text-center font-body text-xs text-muted-foreground">
          {error.message}
        </Text>
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
