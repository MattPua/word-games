/** @type {import('tailwindcss').Config} */
export default {
  theme: {
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
      fontFamily: {
        display: ["Grandstander", "system-ui", "sans-serif"],
        body: ["Lexend", "system-ui", "sans-serif"],
      },
      borderRadius: {
        ui: "var(--radius)",
      },
    },
  },
};
