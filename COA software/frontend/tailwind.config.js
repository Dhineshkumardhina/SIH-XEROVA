/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rail: {
          bg: '#0f172a',      // slate-900
          panel: '#1e293b',   // slate-800
          border: '#334155',  // slate-700
          accent: '#3b82f6',  // blue-500
          accentHover: '#2563eb', // blue-600
        }
      }
    },
  },
  plugins: [],
}
