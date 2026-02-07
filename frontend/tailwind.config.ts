import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0b0f14",
          800: "#131a24",
          700: "#1c2536",
        },
        accent: "#6366f1",
        "accent-light": "#818cf8",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
