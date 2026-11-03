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
        ndis: {
          purple: "#6D28D9",
          teal: "#0D9488",
          navy: "#050A18",
          amber: "#D97706",
        },
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-teal":
          "0 4px 24px rgba(0,0,0,0.30), 0 0 0 1px rgba(20,184,166,0.06) inset, inset 0 1px 0 rgba(20,184,166,0.10)",
        "glow-teal": "0 0 20px rgba(20,184,166,0.35)",
        "glow-indigo": "0 0 20px rgba(99,102,241,0.30)",
      },
      animation: {
        "ring-pulse": "ring-pulse 2.8s ease-in-out infinite",
        "ring-pulse-red": "ring-pulse-red 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
