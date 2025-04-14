/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Public Sans", "sans-serif"],
      },
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "#488BBE",
          variant1: "#8CC3EE",
          variant2: "#3399E9",
          light: "#E2F9FF",
        },
        // Accent colors
        accent: {
          DEFAULT: "#87C054",
          variant1: "#6DAF31",
          variant2: "#A1CA7D",
        },
        core: {
          background: "#F8F7FA", 
          surface: "#FFFFFF",
          error: "#EE4266",
          success: "#0EAD69",
          warning: "#FFF8E0",
        },
        // Additional colors
        orange: {
          DEFAULT: "#F59E0B",
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-hide": {
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
          /* IE and Edge */
          "-ms-overflow-style": "none",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};