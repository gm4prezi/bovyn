/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // BOVYN real brand palette
        bg: "#040404",
        cream: "#F8F6F2",
        amber: {
          DEFAULT: "#F0A020",
          50: "#FFF7E6",
          100: "#FDE9B8",
          200: "#FAD074",
          300: "#F6B842",
          400: "#F0A020",
          500: "#D48712",
          600: "#A66708",
          700: "#7A4B04",
        },
        navy: "#07111E",
        surface: {
          DEFAULT: "#0D1219",
          raised: "#121821",
          high: "#161D28",
        },
        fog: {
          DEFAULT: "#6B7A92",
          dim: "#4A566B",
        },
        bull: "#10C864",
        bear: "#FF4D4D",
        hairline: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        mono: ['"Space Mono"', '"JetBrains Mono"', "Menlo", "monospace"],
      },
      fontWeight: {
        light: "300",
      },
      boxShadow: {
        "amber-glow": "0 0 32px rgba(240,160,32,0.2), 0 0 80px rgba(240,160,32,0.08)",
        "amber-glow-sm": "0 0 16px rgba(240,160,32,0.15)",
        "amber-glow-lg": "0 0 40px rgba(240,160,32,0.35), 0 0 100px rgba(240,160,32,0.15)",
        card: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover": "0 12px 48px rgba(0,0,0,0.6), 0 0 24px rgba(240,160,32,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "gradient-amber":
          "linear-gradient(135deg, #F0A020 0%, #FFD580 45%, #F0A020 100%)",
        "gradient-amber-soft":
          "linear-gradient(135deg, rgba(240,160,32,0.15) 0%, rgba(240,160,32,0.02) 100%)",
        "gradient-surface":
          "linear-gradient(180deg, rgba(13,18,25,0.7) 0%, rgba(13,18,25,0.4) 100%)",
        "glow-line":
          "linear-gradient(90deg, transparent 0%, rgba(240,160,32,0.5) 50%, transparent 100%)",
        aurora:
          "radial-gradient(ellipse at 20% 0%, rgba(240,160,32,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(7,17,30,0.8) 0%, transparent 50%)",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 3s linear infinite",
        "bounce-dot": "bounce-dot 1.4s ease-in-out infinite",
        "aurora-drift": "aurora-drift 18s ease-in-out infinite",
        "amber-pulse": "amber-pulse 2.4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "40%": { transform: "translateY(-5px)", opacity: "1" },
        },
        "aurora-drift": {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "0.18",
          },
          "33%": {
            transform: "translate(40px, -30px) scale(1.08)",
            opacity: "0.24",
          },
          "66%": {
            transform: "translate(-25px, 15px) scale(0.94)",
            opacity: "0.14",
          },
        },
        "amber-pulse": {
          "0%, 100%": { boxShadow: "0 0 14px rgba(240,160,32,0.25)" },
          "50%": { boxShadow: "0 0 28px rgba(240,160,32,0.45)" },
        },
      },
    },
  },
  plugins: [],
};
