import { Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, EmptyState, Shell } from "@couch-potato/ui";
import { PotatoBoard } from "../components/PotatoBoard";
import {
  createProfile,
  getActiveProfile,
  loadStore,
  renameProfile,
  setActiveProfile,
} from "../storage";

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
              label={p.id === active.id ? "Playing" : "Switch"}
              variant={p.id === active.id ? "secondary" : "primary"}
              disabled={p.id === active.id}
              onPress={() => {
                setActiveProfile(p.id);
                refresh();
              }}
            />
          </View>
        ))
      )}

      <PotatoBoard profile={active} />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="New profile name"
        className="mb-2 rounded-ui border border-border bg-card px-3 py-3 font-body text-foreground"
        placeholderTextColor="#6b756e"
      />
      <Button
        label="Create profile"
        className="mb-2"
        onPress={() => {
          createProfile(name);
          setName("");
          refresh();
        }}
      />
      <Button
        label="Rename active"
        variant="secondary"
        className="mb-2"
        onPress={() => {
          if (!name.trim()) return;
          renameProfile(active.id, name);
          setName("");
          refresh();
        }}
      />
      <Button label="Back" variant="ghost" onPress={() => navigate({ to: "/" })} />
    </Shell>
  );
}
