import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#00ff41",
        "accent-dim": "#00cc34",
        "surface": "#0d0d0d",
        "surface-2": "#141414",
        "surface-3": "#1a1a1a",
        "border": "#222222",
        "muted": "#666666",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
