import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function useResolvedTheme(): "light" | "dark" {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? "dark" : "light";
}

/** Follows the player's dark mode toggle (`.dark` on `<html>` — see `theme.ts`). */
const Toaster = ({ className, style, toastOptions, ...props }: ToasterProps) => {
  const theme = useResolvedTheme();
  return (
    <Sonner
      theme={theme}
      className={["toaster group font-sans", className].filter(Boolean).join(" ")}
      style={{ fontFamily: "var(--font-sans)", ...style }}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "group toast font-display group-[.toaster]:rounded-ui group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-md",
          title: "font-display",
          description: "group-[.toast]:font-body group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:font-body group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:font-body group-[.toast]:text-muted-foreground",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
