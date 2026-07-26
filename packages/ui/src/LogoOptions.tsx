import { Image, type ImageProps } from "react-native";

export type LogoOptionsProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/**
 * Options header mascot — potato on couch holding a gear (device prefs).
 * Web serves `apps/web/public/logo-options.webp` (from
 * `packages/ui/src/logo-options.png` via optimize-sprites) — see AGENTS.md Brand / potato-sprites.
 */
export function LogoOptions({ size = 96, style, ...rest }: LogoOptionsProps) {
  return (
    <Image
      source={{ uri: "/logo-options.webp" }}
      accessibilityLabel="Couch Potato adjusting options"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
