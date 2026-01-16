/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
            900: '#0f172a',
            800: '#1e293b',
        },
        cyan: {
            400: '#22d3ee',
            500: '#06b6d4'
        }
      }
    },
  },
  plugins: [],
}
