import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fest: {
          dark: "#0F0F13",
          card: "#181820",
          cardHover: "#22222D",
          border: "#2E2E3E",
          gold: "#F59E0B",
          goldLight: "#FBBF24",
          orange: "#F97316",
          amber: "#D97706",
          red: "#EF4444",
          cyan: "#06B6D4",
          purple: "#8B5CF6",
          textMuted: "#9CA3AF"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(245, 158, 11, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(245, 158, 11, 0.6)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
