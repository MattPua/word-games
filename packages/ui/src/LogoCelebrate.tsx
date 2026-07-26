import { Image, type ImageProps } from "react-native";

export type LogoCelebrateProps = Omit<ImageProps, "source"> & {
  size?: number;
};

/**
 * Pixel potato mid-celebration — results-screen hero (not the chill lobby
 * `Logo`). Web serves `apps/web/public/logo-celebrate.webp` (from
 * `packages/ui/src/assets/logo-celebrate.png` via optimize-sprites) — see AGENTS.md Brand. Source art is
 * a PixelLab celebrate render with a black knockout background; the shipped
 * asset must land with a transparent (not black) alpha, matching `Logo`.
 */
export function LogoCelebrate({ size = 96, style, ...rest }: LogoCelebrateProps) {
  return (
    <Image
      source={{ uri: "/logo-celebrate.webp" }}
      accessibilityLabel="Couch Potato celebrating"
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...rest}
    />
  );
}
