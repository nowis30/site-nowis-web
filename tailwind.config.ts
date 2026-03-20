/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/screens/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5ed',
          100: '#ffe7d4',
          200: '#ffcaa8',
          300: '#ffa36f',
          400: '#ff7d36',
          500: '#ff5a1f',
          600: '#f03d12',
          700: '#c82b10',
          800: '#9f2414',
          900: '#7f2216',
          950: '#461008',
        },
        secondary: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ff9d9d',
          400: '#ff6767',
          500: '#f63b3b',
          600: '#df2020',
          700: '#ba1717',
          800: '#991818',
          900: '#7f1a1a',
        },
        steel: {
          50: '#f6f7f9',
          100: '#ebedf1',
          200: '#d6dae2',
          300: '#b2bac7',
          400: '#8a96ab',
          500: '#6b768c',
          600: '#555f73',
          700: '#444b5b',
          800: '#2f3440',
          900: '#1d2028',
          950: '#0c0f14',
        },
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        coal: {
          900: '#121317',
          950: '#090a0d',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 12px 40px rgba(12, 15, 20, 0.12)',
        'card': '0 18px 60px rgba(12, 15, 20, 0.18)',
        'glow': '0 0 40px rgba(255, 90, 31, 0.28)',
        'fire': '0 18px 55px rgba(240, 61, 18, 0.35)',
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(circle at top left, rgba(255, 122, 43, 0.24), transparent 32%), radial-gradient(circle at right, rgba(246, 59, 59, 0.14), transparent 26%)',
        'brand-hero': 'radial-gradient(circle at top left, rgba(255,122,43,0.30), transparent 26%), radial-gradient(circle at top right, rgba(246,59,59,0.18), transparent 24%), linear-gradient(180deg, #090a0d 0%, #121317 48%, #1d2028 100%)',
        'brand-panel': 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        'brand-warm': 'linear-gradient(135deg, #ff7d36 0%, #f03d12 55%, #7f2216 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(255, 90, 31, 0)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 90, 31, 0.18)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
