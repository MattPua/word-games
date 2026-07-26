import { View } from "react-native";
import type { ReactNode } from "react";
import { Shell } from "@couch-potato/ui";

/**
 * Full-width viewport scroll with narrow (or widened `cp-shell-*`) content
 * centered inside a `Shell`. Keeps the scrollbar at the **viewport** edge
 * instead of mid-column when a chrome page is scrolled and widened on
 * desktop (see `.cursor/rules/ui.mdc` "Desktop real estate").
 *
 * Do **not** put `overflow-x: hidden` on the Shell/`cp-*` container — that
 * forces `overflow-y: auto` and traps scroll inside the max-width column.
 * Use `overflow-x: clip` if you need to kill horizontal bleed.
 */
export function ScrollShell({
  children,
  shellClassName = "",
}: {
  children: ReactNode;
  shellClassName?: string;
}) {
  return (
    <View className="flex min-h-0 w-full flex-1 flex-col">
      <div className="cp-shell-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
        <Shell className={`!h-auto min-h-full !flex-none ${shellClassName}`.trim()}>{children}</Shell>
      </div>
    </View>
  );
}
