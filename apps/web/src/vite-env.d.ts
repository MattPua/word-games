/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Per-icon / helper paths from `vite.lucide-optimize` / lucide #1944 alias. */
declare module "lucide-react/icons/*" {
  import type { LucideProps } from "lucide-react";
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  const Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  export default Icon;
}

declare module "lucide-react/createLucideIcon" {
  import type { LucideIcon } from "lucide-react";
  import type { IconNode } from "lucide-react";
  const createLucideIcon: (name: string, iconNode: IconNode) => LucideIcon;
  export default createLucideIcon;
}

declare module "lucide-react/Icon" {
  import type { LucideProps } from "lucide-react";
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  const Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  export default Icon;
}
