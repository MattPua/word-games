import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ui font-body text-sm font-bold transition-[transform,box-shadow,background-color,color,filter] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:translate-y-px motion-reduce:transition-colors motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_70%,#2c322e)] hover:brightness-105 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_color-mix(in_srgb,var(--primary)_70%,#2c322e)] active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--primary)_70%,#2c322e)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_3px_0_0_color-mix(in_srgb,var(--destructive)_75%,#2c322e)] hover:brightness-105 hover:-translate-y-0.5 active:shadow-none",
        outline:
          "border-2 border-border bg-card/80 text-foreground shadow-sm hover:border-primary/50 hover:bg-accent/30 hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_3px_0_0_color-mix(in_srgb,var(--secondary)_65%,#2c322e)] hover:brightness-105 hover:-translate-y-0.5 active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--secondary)_65%,#2c322e)]",
        ghost: "text-foreground hover:bg-muted/80 hover:text-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        segment:
          "relative bg-transparent text-muted-foreground shadow-none transition-[color,transform] duration-200 hover:text-foreground active:scale-100",
        "segment-active": "relative bg-transparent text-foreground shadow-none active:scale-100",
      },
      size: {
        default: "min-h-11 h-11 px-5 py-2 text-[0.95rem]",
        sm: "min-h-9 h-9 rounded-xl px-3 text-xs",
        lg: "min-h-12 h-12 rounded-ui px-8 text-base tracking-wide",
        /** Icon-only chrome — hover/active/on motion via `.cp-icon-btn` in index.css */
        icon: "cp-icon-btn h-11 w-11 min-h-11",
        "icon-sm": "cp-icon-btn h-9 w-9 min-h-9 rounded-xl",
      },
    },
    compoundVariants: [
      {
        size: ["icon", "icon-sm"],
        className:
          "hover:translate-y-0 active:translate-y-0 active:scale-100 motion-reduce:active:scale-100",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        data-variant={variant ?? "default"}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
