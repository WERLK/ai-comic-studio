/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cyber: {
          purple: "#2D1B4E",
          pink: "#FF2E63",
          blue: "#08F7FE",
          yellow: "#F7F052",
          dark: "#0D0D0D",
          dark2: "#1A1A2E",
        },
      },
      fontFamily: {
        display: ["Orbitron", "Noto Sans SC", "sans-serif"],
        body: ["Noto Sans SC", "sans-serif"],
        comic: ["Comic Neue", "cursive"],
      },
      boxShadow: {
        neon: "0 0 10px rgba(255, 46, 99, 0.5), 0 0 20px rgba(255, 46, 99, 0.3)",
        "neon-blue": "0 0 10px rgba(8, 247, 254, 0.5), 0 0 20px rgba(8, 247, 254, 0.3)",
        "neon-yellow": "0 0 10px rgba(247, 240, 82, 0.5), 0 0 20px rgba(247, 240, 82, 0.3)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
