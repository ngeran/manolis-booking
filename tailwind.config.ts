import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#000000",
        obsidian: "#003642",
        "cyber-blue": "#00A2FD",
        "tactical-gold": "#F1BC93",
        // Dim gray for labels/secondary text — ≥4.5:1 on black (WCAG AA)
        outline: "#737A7E",
        "surface-low": "#0E0E0E",
        surface: "#1F1F1F",
      },
      fontFamily: {
        headline: ["var(--font-headline)", "'Space Grotesk'", "monospace"],
        body: ["var(--font-body)", "'Inter'", "sans-serif"],
      },
      letterSpacing: {
        headline: "0.05rem",
      },
      animation: {
        pulse: "pulse 0.8s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
