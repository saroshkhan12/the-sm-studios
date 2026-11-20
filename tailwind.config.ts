
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F5F0E8",
        beige: "#202020",
        ink: "#F5F0E8",
        clay: "#C6A477",
        wine: "#762F3C",
        stone: "#B8B3AD",
        charcoal: "#111111",
        graphite: "#171717",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "Arial", "sans-serif"],
      },
    },
  },
  plugins: []
};
export default config;
