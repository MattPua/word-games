import { Text } from "react-native";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState, Logo, Shell } from "@couch-potato/ui";
import { Button } from "@/components/ui/button";

/** Unknown route — potato took a wrong turn off the couch. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Shell className="items-center justify-center">
      <Logo size={100} />
      <Text className="mt-4 font-display text-5xl text-primary">404</Text>
      <EmptyState
        title="Lost behind the couch cushions"
        body="That page isn't in this living room. Maybe it rolled under the sofa."
        className="mt-2"
      />
      <Button className="mt-2 w-full" onClick={() => navigate({ to: "/" })}>
        Back to the couch
      </Button>
    </Shell>
  );
}
