import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-patrick)", "var(--font-mali)", "var(--font-noto-thai)", "cursive", "sans-serif"],
      },
      colors: {
        paper: "#faf8f5",
        pastel: {
          blue: "#b5d8f7",
          green: "#b8e6b3",
          yellow: "#fdfd96",
          pink: "#ffb6b9",
          purple: "#e1ccfa",
          orange: "#ffd1a9",
        }
      }
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
