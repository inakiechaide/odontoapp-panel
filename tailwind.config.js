/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta clínica teal/petróleo: fresca, profesional, "odontológica"
        brand: {
          50: '#EFFAF9',
          100: '#D3F1EE',
          200: '#A9E4DD',
          300: '#74D0C7',
          400: '#34B5AA',
          500: '#14A89E',
          600: '#0C857E',
          700: '#0A6A64',
          800: '#0A524E',
          900: '#0A3F3C',
        },
        appointment: {
          pending: '#D97706',
          confirmed: '#0C857E',
          cancelled: '#DC2626',
          absent: '#64748B',
          inprogress: '#0E7490',
          completed: '#0F766E',
        },
      },
      fontFamily: {
        // Serif editorial para títulos (sensación científica/elegante)
        display: ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        // Sombra suave y sobria para tarjetas
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
