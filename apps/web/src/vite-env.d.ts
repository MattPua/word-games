/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Per-icon paths from `vite.lucide-optimize` / lucide #1944 alias. */
declare module "lucide-react/icons/*" {
  import type { LucideProps } from "lucide-react";
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  const Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  export default Icon;
}
