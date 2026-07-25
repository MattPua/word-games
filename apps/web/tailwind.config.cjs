/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,tsx}",
    "../../packages/ui/src/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: require("../../packages/ui/tailwind-preset.cjs").theme.extend,
  },
  plugins: [],
};
