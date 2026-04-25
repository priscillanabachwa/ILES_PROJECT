/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight': '#0f172a',
        'slate-panel': '#1e293b',
        'iles-indigo': '#6366f1',
      },
    },
  },
  plugins: [],
}