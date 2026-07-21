export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A84FF',
          dark: '#0066CC',
          light: '#4DA6FF',
        },
        secondary: {
          DEFAULT: '#30D158',
          dark: '#248A3D',
          light: '#6EE7A6',
        },
        surface: '#FFFFFF',
        background: '#F5F5F7',
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        border: '#E5E5EA',
        agent: {
          commander: '#0A84FF',
          steve: '#30D158',
          elon: '#FF9F0A',
          edwin: '#FF375F',
          nikitta: '#5E5CE6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
