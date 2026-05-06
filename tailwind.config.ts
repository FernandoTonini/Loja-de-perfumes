import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E5C76B",
          dark: "#9E7F2A",
          50: "#FDF8EC",
          100: "#FAEFD3",
          200: "#F4DDA7",
          300: "#EEC77B",
          400: "#E5C76B",
          500: "#C9A84C",
          600: "#9E7F2A",
          700: "#7A5F1A",
          800: "#5C4713",
          900: "#3D2F0D",
        },
        dark: {
          DEFAULT: "#0A0A0A",
          100: "#1A1A1A",
          200: "#222222",
          300: "#2A2A2A",
          400: "#333333",
          500: "#444444",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A84C 0%, #E5C76B 50%, #9E7F2A 100%)",
        "dark-gradient": "linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
