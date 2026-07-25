import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { scoreWord } from "@couch-potato/game-engine";
import { getDictionary } from "@couch-potato/dictionary";
import { applyPathCell } from "@couch-potato/ui";

/**
 * Expo smoke — workspace imports of ui (path helpers) + engine + dictionary.
 * Styled RN Button / NativeWind on Expo comes later.
 */
export default function App() {
  const dict = getDictionary();
  const path = applyPathCell([], { row: 0, col: 0 });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Couch Potato</Text>
      <Text style={styles.line}>Expo smoke OK</Text>
      <Text style={styles.line}>scoreWord(5) = {scoreWord(5)}</Text>
      <Text style={styles.line}>
        dict.has(&quot;potato&quot;) = {String(dict.has("potato"))}
      </Text>
      <Text style={styles.line}>applyPathCell = {path?.length ?? 0} cell</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c322e",
    marginBottom: 8,
  },
  line: {
    fontSize: 14,
    color: "#3d4a41",
  },
});
