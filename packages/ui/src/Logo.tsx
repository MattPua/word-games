import { Image, type ImageProps } from "react-native";

export type LogoProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/**
 * Pixel potato-on-couch mark. Web serves `apps/web/public/logo.webp`
 * (from `packages/ui/src/assets/logo.png` via optimize-sprites). PWA manifest still uses `logo.png`.
 */
export function Logo({ size = 96, style, ...rest }: LogoProps) {
  return (
    <Image
      source={{ uri: "/logo.webp" }}
      accessibilityLabel="Couch Potato"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
