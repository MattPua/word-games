import { View, type ViewProps } from "react-native";

export type ShellProps = ViewProps & {
  className?: string;
};

/**
 * Mobile-first max-width play column — fills the viewport shell (root `h-dvh`).
 * Default `max-w-md` (play / results stay narrow). Web lobby: add `cp-shell-lobby`
 * (wider md/lg via media in `apps/web` `index.css`) + scroll main + shrink-0 Play.
 * Long pages: pass `overflow-y-auto cp-shell-scroll` (gutter in `theme.css`).
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
