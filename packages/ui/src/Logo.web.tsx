import { Image, type ImageProps } from "react-native";

export type LogoProps = Omit<ImageProps, "source"> & {
  size?: number;
};

// react-native-web has no `imageRendering` in its style types, but it passes
// unknown keys straight through to the underlying <img> as CSS.
const pixelated = { imageRendering: "pixelated" } as unknown as ImageProps["style"];

/**
 * Pixel potato-on-couch mark (web build). Same source as `Logo.tsx`, but keeps
 * the source art's hard pixel edges when scaled instead of the browser's
 * default smoothing blur — see AGENTS.md Brand.
 */
export function Logo({ size = 96, style, ...rest }: LogoProps) {
  return (
    <Image
      source={{ uri: "/logo.png" }}
      accessibilityLabel="Couch Potato"
      style={[{ width: size, height: size }, pixelated, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
