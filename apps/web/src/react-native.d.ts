/** Ambient RN types for web — runtime resolves to react-native-web via Vite. */
declare module "react-native" {
  import type { ComponentType, ReactNode } from "react";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type StyleProp<T = any> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ViewStyle = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type TextStyle = any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ViewProps = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type TextProps = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type PressableProps = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ImageProps = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type LayoutChangeEvent = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type GestureResponderEvent = any;

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Pressable: ComponentType<PressableProps>;
  export const TextInput: ComponentType<any>;
  export const Image: ComponentType<ImageProps>;
}
