import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aurora: {
          bg0: "#050B10",
          bg1: "#07131A",
          surface0: "#0A1D24",
          surface1: "#0D2630",
          surface2: "#103543",
          border: "rgba(120, 255, 245, 0.12)",
          "border-strong": "rgba(120, 255, 245, 0.22)",
          text0: "#EAF2F2",
          text1: "rgba(234, 242, 242, 0.72)",
          text2: "rgba(234, 242, 242, 0.52)",
          accent0: "#2AFADF",
          accent1: "#26C6FF",
          accent2: "#7C3AED",
          danger: "#FB7185",
          success: "#34D399",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "aurora-glow": "0 0 0 1px rgba(38,198,255,0.25), 0 0 22px rgba(38,198,255,0.18)",
        "aurora-glow-sm": "0 0 0 1px rgba(38,198,255,0.2), 0 0 12px rgba(38,198,255,0.15)",
        card: "0 10px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
