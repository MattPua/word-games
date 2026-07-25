import { View, type ViewProps } from "react-native";

export type ShellProps = ViewProps & {
  className?: string;
};

/**
 * Mobile-first max-width play column — fills the viewport shell (root `h-dvh`).
 * Lobby: `overflow-hidden` + scrollable main (`flex-1 min-h-0 overflow-y-auto cp-shell-scroll`) +
 * shrink-0 footer. Long pages: pass `overflow-y-auto cp-shell-scroll` (gutter in `theme.css`).
 */
export function Shell({ className = "", children, ...rest }: ShellProps) {
  return (
    <View
      className={`cp-shell mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col bg-transparent px-4 pb-6 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
