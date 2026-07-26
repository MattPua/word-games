import { Image, type ImageProps } from "react-native";

export type BrandMarkProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/** Compact potato-face mark for chrome headers (native stub). */
export function BrandMark({ size = 40, style, ...rest }: BrandMarkProps) {
  return (
    <Image
      source={{ uri: "/logo-mark.webp" }}
      accessibilityLabel="Couch Potato"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
