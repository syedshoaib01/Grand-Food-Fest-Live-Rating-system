import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      zIndex: {
        content: "0",
        sticky: "10",
        bottomNav: "20",
        header: "30",
        devTools: "40",
        backdrop: "50",
        drawer: "60",
        modal: "70",
        toast: "80",
      },
      colors: {
        fest: {
          cream: "#FAF8F5",
          surface: "#FFFFFF",
          surfaceMuted: "#F5F3EF",
          border: "#E7E5E4",
          borderDark: "#D6D3D1",
          charcoal: "#1C1917",
          charcoalMuted: "#78716C",
          charcoalTertiary: "#A8A29E",
          saffron: "#D97706",
          gold: "#F59E0B",
          goldLight: "#FEF3C7",
          orange: "#EA580C",
          orangeLight: "#FFEDD5",
          green: "#16A34A",
          greenLight: "#DCFCE7",
          red: "#DC2626",
          // Dark palette for admin & contrast
          dark: "#121110",
          card: "#1C1917",
          cardHover: "#292524",
          cardDark: "#1C1917",
          cardHoverDark: "#292524",
          borderDarkTheme: "#292524",
          textDarkTheme: "#F5F5F4",
          textDarkMuted: "#A8A29E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        medium: "0 2px 8px -1px rgba(0, 0, 0, 0.05)",
        overlay: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
        drawer: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        card: "12px",
        cardLg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
