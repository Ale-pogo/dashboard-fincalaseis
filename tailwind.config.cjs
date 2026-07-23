/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'verde-bosque': 'var(--color-verde-bosque, #1b4332)',
        'verde-esmeralda': 'var(--color-verde-esmeralda, #2d6a4f)',
        'verde-menta': 'var(--color-verde-menta, #52b788)',
        'verde-claro': 'var(--color-verde-claro, #d8f3dc)',
        'fondo-sitio': 'var(--color-fondo-sitio, #f7f9f6)'
      }
    }
  },
  plugins: []
}
