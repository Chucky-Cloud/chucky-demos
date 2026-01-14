/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EU Official Blue
        'eu-blue': '#003399',
        'eu-blue-dark': '#002266',
        'eu-blue-light': '#4d79cc',
        // EU Yellow (stars)
        'eu-yellow': '#ffcc00',
        // Form colors
        'form-bg': '#f5f7fa',
        'form-border': '#c5cdd8',
        'form-focus': '#003399',
        'form-error': '#c0392b',
        'form-success': '#27ae60',
      },
      fontFamily: {
        'official': ['Georgia', 'Times New Roman', 'serif'],
        'form': ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
