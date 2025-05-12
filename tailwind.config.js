// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0E0B12",
        "gradient-from": "#38B2AC", // teal-400
        "gradient-to": "#6366F1", // indigo-500
        "gradient-hover-from": "#2C9A94", // teal-500
        "gradient-hover-to": "#4F46E5", // indigo-600
      },
      boxShadow: {
        glow: "0 0 15px 2px rgba(56, 178, 172, 0.3)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
