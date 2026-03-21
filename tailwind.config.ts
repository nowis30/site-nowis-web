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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        steel: {
          50: '#f8fafc',
          100: '#eef2ff',
          200: '#dbe4f0',
          300: '#b8c4d8',
          400: '#93a4c0',
          500: '#6f80a1',
          600: '#54617d',
          700: '#3d475f',
          800: '#293247',
          900: '#151b2c',
          950: '#090d18',
        },
        ember: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#38bdf8',
          600: '#0ea5e9',
          700: '#0284c7',
          800: '#0369a1',
          900: '#075985',
        },
        coal: {
          900: '#0b1220',
          950: '#050816',
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
        'soft': '0 16px 44px rgba(2, 6, 23, 0.28)',
        'card': '0 24px 70px rgba(2, 6, 23, 0.42)',
        'glow': '0 0 42px rgba(96, 165, 250, 0.24)',
        'fire': '0 20px 58px rgba(37, 99, 235, 0.34)',
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(circle at top left, rgba(96,165,250,0.22), transparent 32%), radial-gradient(circle at right, rgba(139,92,246,0.16), transparent 26%)',
        'brand-hero': 'radial-gradient(circle at top left, rgba(96,165,250,0.22), transparent 24%), radial-gradient(circle at top right, rgba(139,92,246,0.18), transparent 22%), radial-gradient(circle at 50% 120%, rgba(14,165,233,0.12), transparent 34%), linear-gradient(180deg, #050816 0%, #0b1220 50%, #131c33 100%)',
        'brand-panel': 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        'brand-warm': 'linear-gradient(135deg, #60a5fa 0%, #4f46e5 55%, #312e81 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(96, 165, 250, 0)' },
          '50%': { boxShadow: '0 0 30px rgba(96, 165, 250, 0.22)' },
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
