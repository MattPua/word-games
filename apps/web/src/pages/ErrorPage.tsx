import { Text } from "react-native";
import {
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Button, EmptyState, Logo, Shell } from "@couch-potato/ui";

/** Unexpected failure — potato spilled the snacks. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <Shell className="items-center justify-center">
      <Logo size={100} />
      <Text className="mt-4 font-display text-5xl text-primary">500</Text>
      <EmptyState
        title="Snack spill in aisle potato"
        body="Something unexpected flopped. Shake the crumbs off and try again."
        className="mt-2"
      />
      {import.meta.env.DEV && error?.message ? (
        <Text className="mb-4 max-w-sm text-center font-body text-xs text-muted-foreground">
          {error.message}
        </Text>
      ) : null}
      <Button
        label="Try again"
        className="mb-2 w-full"
        onPress={() => {
          reset?.();
          void router.invalidate();
        }}
      />
      <Button
        label="Back to the couch"
        variant="secondary"
        className="w-full"
        onPress={() => navigate({ to: "/" })}
      />
    </Shell>
  );
}
