import { Text, View } from "react-native";
import { Logo } from "./Logo";

export type LoadingPotatoProps = {
  message?: string;
  className?: string;
};

/** Whimsical loading — board gen, route waits. */
export function LoadingPotato({
  message = "Growing potatoes…",
  className = "",
}: LoadingPotatoProps) {
  return (
    <View className={`flex-1 items-center justify-center px-6 py-12 ${className}`}>
      <Logo size={88} />
      <Text className="mt-4 text-center font-display text-xl text-foreground">{message}</Text>
      <Text className="mt-1 text-center font-body text-sm text-muted-foreground">
        Soft letters. Almost there.
      </Text>
    </View>
  );
}
