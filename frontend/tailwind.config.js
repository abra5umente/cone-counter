/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cone-green': '#10b981',
        'cone-dark': '#064e3b',
        'cone-light': '#d1fae5',
      }
    },
  },
  plugins: [],
}
