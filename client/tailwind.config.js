/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#05070a',
          900: '#090d14',
          850: '#0d131d',
          800: '#121927',
          750: '#182133',
          700: '#1f2b42',
          600: '#2c3c5c',
        },
        cyber: {
          green: '#10b981',
          emerald: '#059669',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          purple: '#a855f7',
          cyan: '#06b6d4',
          sky: '#38bdf8',
          amber: '#f59e0b',
          rose: '#f43f5e',
          red: '#ef4444',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -4px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(244, 63, 94, 0.35)',
        'glow-purple': '0 0 25px -4px rgba(168, 85, 247, 0.35)',
        'terminal-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 2s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
