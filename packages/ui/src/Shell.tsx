import { View, type ViewProps } from "react-native";

export type ShellProps = ViewProps & {
  className?: string;
};

/** Mobile-first max-width play column. */
export function Shell({ className = "", children, ...rest }: ShellProps) {
  return (
    <View
      className={`mx-auto w-full max-w-md flex-1 bg-background px-4 py-6 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
