const animations = require("@midudev/tailwind-animations");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "custom-bg": "#3b3423",
        "custom-text": "#ffffff",
        "custom-card-bg": "#4a4332",
      },
      animation: {
        'fade-in-1': 'fadeIn 2s',
        'fade-in-2': 'fadeIn 4s',
        'fade-in-3': 'fadeIn 6s',
        'fade-in-4': 'fadeIn 8s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [animations],
};
