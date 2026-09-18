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
          cream: "#FAF8F5",
          surface: "#FFFFFF",
          surfaceMuted: "#F5F3EF",
          border: "#E7E5E4",
          borderDark: "#D6D3D1",
          charcoal: "#1C1917",
          charcoalMuted: "#78716C",
          saffron: "#D97706",
          gold: "#F59E0B",
          goldLight: "#FEF3C7",
          orange: "#EA580C",
          orangeLight: "#FFEDD5",
          green: "#16A34A",
          greenLight: "#DCFCE7",
          red: "#DC2626",
          // Dark palette for admin & contrast
          dark: "#141312",
          cardDark: "#1E1C1A",
          cardHoverDark: "#2B2824",
          borderDarkTheme: "#36322D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        float: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        card: "12px",
        cardLg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
