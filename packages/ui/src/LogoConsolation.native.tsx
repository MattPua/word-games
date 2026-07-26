import { Image, type ImageProps } from "react-native";

export type LogoConsolationProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/** Sheepish shrug mark — empty haul / better luck next time. */
export function LogoConsolation({ size = 96, style, ...rest }: LogoConsolationProps) {
  return (
    <Image
      source={{ uri: "/logo-consolation.webp" }}
      accessibilityLabel="Couch Potato shrugging"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
