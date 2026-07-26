import { View, type ViewProps } from "react-native";

export type ShellProps = ViewProps & {
  className?: string;
};

/**
 * Mobile-first max-width play column — fills the viewport shell (root `h-dvh`).
 * Default `max-w-md` (**play** stays narrow). Chrome pages (lobby, Couch crew,
 * Results, and similar) widen + go multi-col on md+: add `cp-shell-lobby` /
 * `cp-shell-crew` / `cp-shell-results` (wider md/lg via media in `apps/web`
 * `index.css`) + a `cp-lobby`/`cp-crew`/`cp-results` container for that page's
 * 2-col breakpoints. See `.cursor/rules/ui.mdc` "Desktop real estate".
 * Long pages that scroll Shell itself: `overflow-y-auto cp-shell-scroll`
 * (gutter in `theme.css`). Full-width viewport scroll with the scrollbar at
 * the true edge (not mid-column once widened): `ScrollShell` in web
 * `apps/web/src/components/ScrollShell.tsx` (used by Results, Couch crew).
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
