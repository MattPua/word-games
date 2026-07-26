import type { HTMLAttributes, ReactNode } from "react";

export type ShellProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children?: ReactNode;
};

/**
 * Web Shell — DOM `div` (avoids react-native-web on chrome cold path).
 * See `Shell.tsx` for layout contract / desktop widen classes.
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
