/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prime: {
          dark: "#050a1a",
          navy: "#0a1330",
          glass: "rgba(10, 19, 48, 0.7)",
          accent: "#00f2ff",
          glow: "#aa3bff",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 15px rgba(170, 59, 255, 0.5)',
      },
    },
  },
  plugins: [],
}

