import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

export type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: Variant;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-primary active:opacity-90",
  secondary: "bg-secondary active:opacity-90",
  ghost: "bg-transparent active:opacity-70",
};

const labelClass: Record<Variant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  ghost: "text-foreground",
};

export function Button({
  label,
  variant = "primary",
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`items-center justify-center rounded-ui px-5 py-3 ${variantClass[variant]} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      {...rest}
    >
      <Text className={`font-body text-base font-bold ${labelClass[variant]}`}>{label}</Text>
    </Pressable>
  );
}
