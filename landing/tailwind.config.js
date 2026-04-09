/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2F80ED',
          soft: 'rgba(47, 128, 237, 0.1)',
        },
        secondary: {
          DEFAULT: '#27AE60',
          soft: 'rgba(39, 174, 96, 0.1)',
        },
        accent: '#F2994A',
        'off-white': '#F7F9FC',
        'text-main': '#1A202C',
        'text-muted': '#4A5568',
        'text-light': '#718096',
        'border-color': '#E2E8F0',
      },
      borderRadius: {
        'lg': '24px',
        'md': '12px',
        'sm': '8px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'float': 'floating 4s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    },
  },
  plugins: [],
}
