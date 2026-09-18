import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#f8f9ff",
        foreground: "#0b1c30",
        primary: {
          DEFAULT: "#00236f",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#006591",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#dce9ff",
          foreground: "#444651",
        },
        accent: {
          DEFAULT: "#d3e4fe",
          foreground: "#0b1c30",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0b1c30",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0b1c30",
        },
        // ─── Stitch Design System Palette ───
        "error-container": "#ffdad6",
        "on-surface": "#0b1c30",
        "on-background": "#0b1c30",
        "on-secondary-fixed-variant": "#004c6e",
        "on-tertiary-fixed": "#410002",
        "on-error-container": "#93000a",
        "on-error": "#ffffff",
        surface: "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-high": "#dce9ff",
        "tertiary-fixed-dim": "#ffb4ab",
        "on-tertiary-container": "#ff8b80",
        "on-primary": "#ffffff",
        "surface-variant": "#d3e4fe",
        "inverse-on-surface": "#eaf1ff",
        "secondary-fixed-dim": "#89ceff",
        "primary-fixed": "#dce1ff",
        outline: "#757682",
        "primary-container": "#1e3a8a",
        "inverse-primary": "#b6c4ff",
        "tertiary-fixed": "#ffdad6",
        tertiary: "#5d0004",
        "on-primary-container": "#90a8ff",
        "on-primary-fixed": "#00164e",
        "surface-container-low": "#eff4ff",
        "on-secondary-fixed": "#001e2f",
        "inverse-surface": "#213145",
        "surface-container-highest": "#d3e4fe",
        "on-tertiary-fixed-variant": "#93000b",
        "on-primary-fixed-variant": "#264191",
        "primary-fixed-dim": "#b6c4ff",
        "surface-tint": "#4059aa",
        "tertiary-container": "#87000a",
        "surface-container": "#e5eeff",
        "secondary-fixed": "#c9e6ff",
        "outline-variant": "#c5c5d3",
        "on-surface-variant": "#444651",
        "on-secondary-container": "#004666",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#f8f9ff",
        error: "#ba1a1a",
        "secondary-container": "#39b8fd",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
      },
      fontSize: {
        "headline-lg": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-md": [
          "20px",
          { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        "headline-sm": [
          "16px",
          { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "body-lg": [
          "15px",
          { lineHeight: "22px", letterSpacing: "0em", fontWeight: "400" },
        ],
        "body-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0em", fontWeight: "400" },
        ],
        "body-sm": [
          "13px",
          { lineHeight: "18px", letterSpacing: "0em", fontWeight: "400" },
        ],
        "label-md": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        "label-sm": [
          "11px",
          { lineHeight: "14px", letterSpacing: "0.03em", fontWeight: "600" },
        ],
        "code-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0em", fontWeight: "400" },
        ],
      },
      fontFamily: {
        sans: ['"Comfortaa"', '"Montserrat"', "sans-serif"],
      },
      animation: {
        "float-card": "float-card 4.5s ease-in-out infinite",
      },
      keyframes: {
        "float-card": {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-8px) scale(1.01)" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
