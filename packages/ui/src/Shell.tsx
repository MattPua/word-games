import type { HTMLAttributes, ReactNode } from "react";

export type ShellProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children?: ReactNode;
};

/**
 * Mobile-first max-width play column — fills the viewport shell (root `h-dvh`).
 * Default `max-w-md` (**play** stays narrow). Chrome pages widen via `cp-shell-*`
 * classes — see `.cursor/rules/ui.mdc` "Desktop real estate".
 */
export function Shell({ className = "", children, ...rest }: ShellProps) {
  return (
    <div
      className={`cp-shell mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col bg-transparent px-4 pb-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
