import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#00ff41",
        "accent-dim": "#00cc33",
        "bg-base": "#0a0a0a",
        "bg-panel": "#111111",
        "bg-card": "#1a1a1a",
        "bg-editor": "#0d0d0d",
        border: "#2a2a2a",
        "text-primary": "#e8e8e8",
        "text-muted": "#666666",
        "text-dim": "#444444",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", "monospace"],
      },
      boxShadow: {
        "accent-glow": "0 0 20px rgba(0, 255, 65, 0.15)",
        "panel": "0 0 0 1px #2a2a2a",
      },
    },
  },
  plugins: [],
};

export default config;
