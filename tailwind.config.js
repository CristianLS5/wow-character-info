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
        "fade-in-3": "fadeIn 0.3s ease-in forwards",
        "fade-in-4": "fadeIn 8s",
        'sway-left': 'swayLeft 1s ease-in-out infinite',
        'sway-right': 'swayRight 1s ease-in-out infinite',
        'accordion-x': 'accordionX 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'blur-in': 'blur-in 0.5s ease-out',
        'blurred-fade-in': 'blurred-fade-in 0.4s ease-in forwards',
        'fade-in': 'fade-in 0.3s ease-in forwards',
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
        },
        accordionX: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-up': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'blur-in': {
          '0%': { filter: 'blur(5px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
        'blurred-fade-in': {
          '0%': {
            opacity: '0',
            filter: 'blur(10px)',
          },
          '100%': {
            opacity: '1',
            filter: 'blur(0)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(255, 255, 255, 0.5)',
      }
    },
  },
  plugins: [
    require("daisyui"),
    animations, 
    addDynamicIconSelectors()
  ],
};
