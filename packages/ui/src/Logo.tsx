import { Image, type ImageProps } from "react-native";

export type LogoProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/** Potato-couch mark — serve from apps/web/public/favicon.svg (or matching asset). */
export function Logo({ size = 96, style, ...rest }: LogoProps) {
  return (
    <Image
      source={{ uri: "/favicon.svg" }}
      accessibilityLabel="Couch Potato"
      style={[{ width: size, height: size * 0.8 }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
