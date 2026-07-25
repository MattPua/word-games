import { Text, View } from "react-native";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, Shell } from "@couch-potato/ui";
import { PotatoBoard } from "../components/PotatoBoard";
import {
  createProfile,
  getActiveProfile,
  loadStore,
  renameProfile,
  setActiveProfile,
} from "../storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfilesPage() {
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const store = loadStore();
  const active = getActiveProfile();
  const [name, setName] = useState("");

  return (
    <Shell>
      <Text className="mb-4 font-display text-2xl text-foreground">Profiles</Text>

      {store.profiles.length === 0 ? (
        <EmptyState
          showLogo
          title="Nobody on the couch"
          body="Make a profile so high scores have a home."
          className="mb-4"
        />
      ) : (
        store.profiles.map((p) => (
          <View
            key={p.id}
            className="mb-3 flex-row items-center justify-between rounded-ui bg-card px-3 py-2"
          >
            <View>
              <Text className="font-body text-base font-bold text-foreground">
                {p.name}
                {p.id === active.id ? " · active" : ""}
              </Text>
              <Text className="font-body text-sm text-muted-foreground">
                {p.gamesPlayed} games · {p.wordsFound} words
              </Text>
            </View>
            <Button
              variant={p.id === active.id ? "secondary" : "default"}
              size="sm"
              disabled={p.id === active.id}
              onClick={() => {
                setActiveProfile(p.id);
                refresh();
              }}
            >
              {p.id === active.id ? "Playing" : "Switch"}
            </Button>
          </View>
        ))
      )}

      <PotatoBoard profile={active} />

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New profile name"
        className="mb-2"
      />
      <Button
        className="mb-2 w-full"
        onClick={() => {
          createProfile(name);
          setName("");
          refresh();
        }}
      >
        Create profile
      </Button>
      <Button
        variant="secondary"
        className="mb-2 w-full"
        onClick={() => {
          if (!name.trim()) return;
          renameProfile(active.id, name);
          setName("");
          refresh();
        }}
      >
        Rename active
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
        <ArrowLeft />
        Back
      </Button>
    </Shell>
  );
}
