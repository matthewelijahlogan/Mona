module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'mona-blue': '#0f6fff',
        'mona-blue-100': '#eaf4ff',
        'mona-orange': '#ff7a2d',
        'mona-gold': '#ffd89b',
        'mona-ink': '#0b2340'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      boxShadow: {
        'mona-soft': '0 8px 30px rgba(15,111,255,0.06)'
      }
    },
  },
  plugins: [],
}
