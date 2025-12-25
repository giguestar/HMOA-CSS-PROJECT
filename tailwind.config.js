/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lx': '#9333ea',
        'kesco': '#3b82f6',
        'cheongam': '#10b981',
        'hanssem': '#f59e0b',
        'homecc': '#ef4444',
        'haemoa': '#06b6d4',
      }
    },
  },
  plugins: [],
}
