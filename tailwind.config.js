/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["'Montserrat'", "system-ui", "sans-serif"],
      },
      colors: {
        ueb: {
          navy:    '#1a3a5c',
          blue:    '#2e6ca4',
          light:   '#54b3e0',
          red:     '#ff0000',
          'red-dk':'#8b0f0f',
          bg:      '#f0f4f8',
          white:   '#FFFFFF',
        },
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(26, 58, 92, 0.12)',
        'glass-lg': '0 20px 60px rgba(26, 58, 92, 0.20)',
        glow:   '0 0 20px rgba(84, 179, 224, 0.35)',
        'glow-strong': '0 0 40px rgba(84, 179, 224, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'counter': 'counter 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
