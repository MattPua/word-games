import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Optional chrome (e.g. web shadcn Button) — keep actions out of this package. */
  children?: ReactNode;
  showLogo?: boolean;
  className?: string;
};

/** Couch-casual empty — no scores, no words, lonely profiles. */
export function EmptyState({
  title,
  body,
  children,
  showLogo = false,
  className = "",
}: EmptyStateProps) {
  return (
    <View className={`items-center px-4 py-6 ${className}`}>
      {showLogo ? <Logo size={72} /> : null}
      <Text
        className={`text-center font-display text-xl text-foreground ${
          showLogo ? "mt-3" : ""
        }`}
      >
        {title}
      </Text>
      {body ? (
        <Text className="mt-1 text-center font-body text-muted-foreground">
          {body}
        </Text>
      ) : null}
      {children ? <View className="mt-4 w-full">{children}</View> : null}
    </View>
  );
}
