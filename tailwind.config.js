/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
        },
        success: '#16a34a',
        warning: '#ca8a04',
        error: '#dc2626',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}