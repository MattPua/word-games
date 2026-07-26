/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    // Replace Tailwind's default `ui-sans-serif` stack — not merely extend.
    // Preflight paints `html { font-family: theme(fontFamily.sans) }`.
    fontFamily: {
      sans: ["var(--font-sans)"],
      body: ["var(--font-body)"],
      display: ["var(--font-display)"],
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        "icon-muted-foreground": "var(--icon-muted-foreground)",
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        path: "var(--path)",
        /** @deprecated prefer secondary — alias of potato gold */
        potato: "var(--secondary)",
        tile: "var(--tile)",
        "board-well": "var(--board-well)",
        "board-frame": "var(--board-frame)",
      },
      borderRadius: {
        ui: "var(--radius)",
      },
    },
  },
};
