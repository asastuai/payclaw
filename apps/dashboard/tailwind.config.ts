import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#00ff41",
        "accent-dim": "#00cc33",
        "accent-glow": "rgba(0, 255, 65, 0.15)",
        surface: {
          DEFAULT: "#111111",
          raised: "#161616",
          border: "#1e1e1e",
          muted: "#0d0d0d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "accent-sm": "0 0 8px rgba(0, 255, 65, 0.2)",
        "accent-md": "0 0 20px rgba(0, 255, 65, 0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
