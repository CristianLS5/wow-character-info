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
    },
  },
  plugins: [animations],
};
