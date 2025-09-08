/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        modalOpen: {
          '0%': { 
            opacity: '0',
            transform: 'translate(-50%, -48%) scale(0.96)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)'
          }
        },
        modalClose: {
          '0%': { 
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)'
          },
          '100%': { 
            opacity: '0',
            transform: 'translate(-50%, -48%) scale(0.96)'
          }
        },
        overlayShow: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
      },
      animation: {
        modalOpen: 'modalOpen 0.3s ease-out',
        modalClose: 'modalClose 0.2s ease-in',
        overlayShow: 'overlayShow 0.3s ease-out'
      }
    },
  },
  plugins: [],
}
