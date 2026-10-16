/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dfe9ff", 200: "#c5d7ff", 300: "#a2bcff",
          400: "#7d98fc", 500: "#5b72f4", 600: "#4351e8", 700: "#3639cc",
          800: "#2d30a5", 900: "#2b2e82", 950: "#191b4d",
        },
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fadeIn .4s ease-out both",
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04)",
        "card-hover": "0 10px 30px rgba(16,24,40,.10)",
      },
    },
  },
  plugins: [],
};
