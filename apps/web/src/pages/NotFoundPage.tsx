import { useNavigate } from "@tanstack/react-router";
import { EmptyState, ScrollShell } from "@couch-potato/ui";
import { Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ChromeTopBar";

/** Unknown route — potato took a wrong turn off the couch. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ScrollShell>
      <PageHeading title="404" className="cp-fade-up" />
      <EmptyState
        title="Lost behind the couch cushions"
        body="That page isn't in this living room. It rolled under the sofa with the remote and the last chip."
        className="mt-2 cp-fade-up cp-stagger-2"
      />
      <Button
        className="mt-2 cp-chrome-cta cp-fade-up cp-stagger-3"
        onClick={() => navigate({ to: "/" })}
      >
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
