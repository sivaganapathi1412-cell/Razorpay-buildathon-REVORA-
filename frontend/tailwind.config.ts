import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        revora: {
          bg: "#07110D",          // Near-black background
          surface: "#101A16",     // Neutral dark surface
          card: "#101A16",        // Neutral dark surface card
          border: "#1C2D24",      // Muted dark forest border
          muted: "#8FA89B",       // Soft muted mint-gray text
          forest: {
            DEFAULT: "#0B3D2E",   // Primary dark green
            deep: "#062A20",      // Deep forest
            light: "#144E3B",     // Medium forest green
          },
          emerald: {
            DEFAULT: "#16A36A",   // Core Emerald Accent
            glow: "rgba(22, 163, 106, 0.15)",
            dark: "#0F764E",
            light: "#22C55E",
          },
          mint: {
            DEFAULT: "#7EE2A8",   // Fresh light green
            soft: "#DDF8E8",      // Soft mint highlight
          },
          razor: {
            DEFAULT: "#16A36A",   // Brand accent aligns with emerald
            light: "#7EE2A8",
            dark: "#062A20",
          },
          amber: {
            DEFAULT: "#F59E0B",
            glow: "rgba(245, 158, 11, 0.15)",
          },
          red: {
            DEFAULT: "#EF4444",
            glow: "rgba(239, 68, 68, 0.15)",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
