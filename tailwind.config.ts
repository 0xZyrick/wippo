import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#080b11",
        surface: "#0e131c",
        line: "rgba(202,220,242,0.12)",
        cream: "#f4f2ec",
        coral: "#ff765f",
        growth: "#9fe3c0",
      },
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
