import { useNavigate } from "@tanstack/react-router";
import { EmptyState, PotatoSprite } from "@couch-potato/ui";
import { Sofa } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { ScrollShell } from "@/components/ScrollShell";

/** Unknown route — potato took a wrong turn off the couch. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ScrollShell>
      <div className="flex min-h-full w-full shrink-0 flex-col items-center justify-center">
        <BrandHeader
          className="cp-fade-up"
          mark={
            <div className="relative" style={{ width: 112, height: 112 }}>
              <PotatoSprite size={112} />
              <div className="cp-404-crumbs" aria-hidden="true">
                <span className="cp-404-crumb cp-404-crumb-1" />
                <span className="cp-404-crumb cp-404-crumb-2" />
                <span className="cp-404-crumb cp-404-crumb-3" />
                <span className="cp-404-crumb cp-404-crumb-4" />
              </div>
            </div>
          }
          title="404"
        />
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
      </div>
    </ScrollShell>
  );
}
