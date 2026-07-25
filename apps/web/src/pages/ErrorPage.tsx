import { Text } from "react-native";
import { useNavigate, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { EmptyState, PotatoSprite, Shell } from "@couch-potato/ui";
import { Button } from "@/components/ui/button";

/** Unexpected failure — potato spilled the snacks. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <Shell className="cp-shell-scroll overflow-y-auto">
      {/* min-h-full + justify-center: centers when short, scrolls when tall */}
      <div className="flex min-h-full w-full shrink-0 flex-col items-center justify-center">
        <div className="cp-fade-up">
          <PotatoSprite size={100} />
        </div>
        <Text className="mt-4 cp-fade-up cp-stagger-1 font-display text-5xl text-primary">500</Text>
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
          className="mb-2 w-full"
          onClick={() => {
            reset?.();
            void router.invalidate();
          }}
        >
          Try again
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => navigate({ to: "/" })}>
          Back to lobby
        </Button>
      </div>
    </Shell>
  );
}
