import { Image, type ImageProps } from "react-native";

export type LogoProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/**
 * Potato-couch mark. Web serves `apps/web/public/favicon.svg`
 * (copy of `packages/ui/src/logo.svg`).
 */
export function Logo({ size = 96, style, ...rest }: LogoProps) {
  return (
    <Image
      source={{ uri: "/favicon.svg" }}
      accessibilityLabel="Couch Potato"
      style={[{ width: size, height: size * (112 / 128) }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
