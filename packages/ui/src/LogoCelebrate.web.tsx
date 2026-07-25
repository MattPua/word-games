import { Image, type ImageProps } from "react-native";

export type LogoCelebrateProps = Omit<ImageProps, "source"> & {
  size?: number;
};

// react-native-web has no `imageRendering` in its style types, but it passes
// unknown keys straight through to the underlying <img> as CSS.
const pixelated = { imageRendering: "pixelated" } as unknown as ImageProps["style"];

/**
 * Pixel potato mid-celebration (web build) — results-screen hero, keeps the
 * source art's hard pixel edges when scaled like `Logo.web`. Same source
 * contract as `LogoCelebrate.tsx` — see AGENTS.md Brand.
 */
export function LogoCelebrate({ size = 96, style, ...rest }: LogoCelebrateProps) {
  return (
    <Image
      source={{ uri: "/logo-celebrate.png" }}
      accessibilityLabel="Couch Potato celebrating"
      style={[{ width: size, height: size }, pixelated, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
