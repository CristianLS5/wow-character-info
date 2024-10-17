const animations = require("@midudev/tailwind-animations");
const { addDynamicIconSelectors } = require('@iconify/tailwind');

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
        "fade-in-1": "fadeIn 2s",
        "fade-in-2": "fadeIn 4s",
        "fade-in-3": "fadeIn 6s",
        "fade-in-4": "fadeIn 8s",
        'sway-left': 'swayLeft 1s ease-in-out infinite',
        'sway-right': 'swayRight 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        swayLeft: {
          '0%, 100%': { transform: 'rotate(85deg) scale(1.2)' },
          '50%': { transform: 'rotate(95deg) scale(1.2)' },
        },
        swayRight: {
          '0%, 100%': { transform: 'rotate(175deg) scale(1.2)' },
          '50%': { transform: 'rotate(185deg) scale(1.2)' },
        }
      },
    },
  },
  plugins: [animations, addDynamicIconSelectors()],
};
