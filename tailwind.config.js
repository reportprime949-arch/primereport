module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#c41e3a',
        secondary: '#1a1a1a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      maxWidth: {
        'article': '800px',
      }
    },
  },
  plugins: [],
}
