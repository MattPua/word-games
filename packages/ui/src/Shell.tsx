import { View, type ViewProps } from "react-native";

export type ShellProps = ViewProps & {
  className?: string;
};

/** Mobile-first max-width play column — transparent so room atmosphere shows. */
export function Shell({ className = "", children, ...rest }: ShellProps) {
  return (
    <View
      className={`mx-auto w-full max-w-md flex-1 bg-transparent px-4 py-6 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
