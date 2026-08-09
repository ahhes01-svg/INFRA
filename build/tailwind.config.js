module.exports = {
  darkMode: 'class',
  // Escanea el HTML actual y los módulos de vista que generaremos
  content: ['../**/*.html', '../js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }], sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }], lg: ['18px', { lineHeight: '26px' }],
        xl: ['24px', { lineHeight: '32px' }],
      },
      colors: {
        brand: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',
                 500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
        surface: { 0:'var(--s0)',1:'var(--s1)',2:'var(--s2)',3:'var(--s3)' },
        ink: { 1:'var(--ink1)',2:'var(--ink2)',3:'var(--ink3)' },
        line: { DEFAULT:'var(--line)', strong:'var(--line-strong)' },
      },
      boxShadow: {
        e1:'0 1px 2px rgba(2,6,23,.06)', e2:'0 4px 12px rgba(2,6,23,.10)', e3:'0 12px 32px rgba(2,6,23,.22)',
      },
      borderRadius: { DEFAULT:'6px' },
    },
  },
};
