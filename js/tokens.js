/* ============================================================================
 * tokens.js — Sistema de diseño · NettOps Perú
 * Software de operaciones técnicas de campo (instalación y mantenimiento BTS)
 *
 * Identidad: consola de monitoreo de red. Sobrio, denso, técnico.
 * - Inter (interfaz) · JetBrains Mono (códigos BTS, coordenadas, IDs, horas)
 * - 5 tamaños de texto: 11 / 13 / 14 / 18 / 24 px
 * - Grises fríos (slate). Un solo acento de marca (azul). Color saturado
 *   reservado a los 5 estados operativos.
 * - Espaciado en múltiplos de 4px. 3 niveles de elevación.
 * - Modo claro + oscuro (nocturno de campo, sin negros puros).
 *
 * Este archivo DEBE cargarse inmediatamente después del CDN de Tailwind.
 * ==========================================================================*/

window.TOKENS = {
  font: {
    ui: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', monospace",
  },
  // Cinco tamaños, no más.
  text: { xs: '11px', sm: '13px', base: '14px', lg: '18px', xl: '24px' },

  // Acento único de marca (azul). El mismo eje azul sirve como estado
  // "en ejecución": un solo acento saturado en toda la interfaz.
  brand: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a',
  },

  // Estados operativos — el único uso de color saturado.
  // Cada uno con par claro/oscuro AA sobre su superficie.
  estado: {
    completado: { light: '#15803d', dark: '#4ade80' }, // verde  · completado / aprobado
    ejecucion:  { light: '#1d4ed8', dark: '#60a5fa' }, // azul   · en ejecución
    pendiente:  { light: '#a16207', dark: '#facc15' }, // ámbar  · pendiente / en revisión
    critico:    { light: '#b91c1c', dark: '#f87171' }, // rojo   · retrasado / crítico
    cancelado:  { light: '#64748b', dark: '#94a3b8' }, // gris   · cancelado
  },

  // Paleta categórica de gráficos — validada (dataviz) en ambas superficies:
  // luz #ffffff, oscuridad #1e293b. Orden fijo, nunca ciclada.
  chart: {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
    dark:  ['#3987e5', '#d95926', '#199e70', '#c98500'],
    grid:  { light: '#e2e8f0', dark: '#334155' },
    tick:  { light: '#64748b', dark: '#94a3b8' },
  },
};

/* --- Configuración de Tailwind (CDN) --------------------------------------*/
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '16px' }],
        sm:   ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg:   ['18px', { lineHeight: '26px' }],
        xl:   ['24px', { lineHeight: '32px' }],
      },
      colors: {
        brand: window.TOKENS.brand,
        // Superficies y tintas semánticas — cambian solas con .dark
        surface: { 0: 'var(--s0)', 1: 'var(--s1)', 2: 'var(--s2)', 3: 'var(--s3)' },
        ink:     { 1: 'var(--ink1)', 2: 'var(--ink2)', 3: 'var(--ink3)' },
        line:    { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
      },
      boxShadow: {
        // Tres niveles de elevación, nada más.
        e1: '0 1px 2px rgba(2,6,23,.06)',
        e2: '0 4px 12px rgba(2,6,23,.10)',
        e3: '0 12px 32px rgba(2,6,23,.22)',
      },
      borderRadius: { DEFAULT: '6px' },
    },
  },
};

/* --- Tema desde la URL (se aplica antes del primer render) ----------------*/
(function applyThemeFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('theme') === 'dark') document.documentElement.classList.add('dark');
})();

/* --- Variables semánticas + base global -----------------------------------*/
(function injectBaseCss() {
  const css = `
  :root{
    /* Superficies (grises fríos) */
    --s0:#f1f5f9;            /* fondo de página            */
    --s1:#ffffff;            /* tarjeta / panel            */
    --s2:#f8fafc;            /* cabecera de tabla, hueco   */
    --s3:#e2e8f0;            /* relleno de pista/skeleton  */
    --ink1:#0f172a;          /* texto principal            */
    --ink2:#475569;          /* texto secundario           */
    --ink3:#94a3b8;          /* texto atenuado             */
    --line:#e2e8f0;
    --line-strong:#cbd5e1;
    --focus:#2563eb;

    /* Estados operativos: texto / fondo suave / borde */
    --st-completado:#15803d; --st-completado-bg:rgba(34,197,94,.13);  --st-completado-bd:rgba(21,128,61,.35);
    --st-ejecucion:#1d4ed8;  --st-ejecucion-bg:rgba(59,130,246,.13);  --st-ejecucion-bd:rgba(29,78,216,.35);
    --st-pendiente:#a16207;  --st-pendiente-bg:rgba(234,179,8,.15);   --st-pendiente-bd:rgba(161,98,7,.35);
    --st-critico:#b91c1c;    --st-critico-bg:rgba(239,68,68,.12);     --st-critico-bd:rgba(185,28,28,.35);
    --st-cancelado:#64748b;  --st-cancelado-bg:rgba(100,116,139,.14); --st-cancelado-bd:rgba(100,116,139,.35);
  }
  .dark{
    /* Nocturno de campo: sin negros puros */
    --s0:#0f172a;
    --s1:#1e293b;
    --s2:#243044;
    --s3:#334155;
    --ink1:#f1f5f9;
    --ink2:#b6c2d4;
    --ink3:#7c8ba1;
    --line:#334155;
    --line-strong:#475569;
    --focus:#60a5fa;

    --st-completado:#4ade80; --st-completado-bg:rgba(74,222,128,.14); --st-completado-bd:rgba(74,222,128,.35);
    --st-ejecucion:#60a5fa;  --st-ejecucion-bg:rgba(96,165,250,.14);  --st-ejecucion-bd:rgba(96,165,250,.35);
    --st-pendiente:#facc15;  --st-pendiente-bg:rgba(250,204,21,.13);  --st-pendiente-bd:rgba(250,204,21,.35);
    --st-critico:#f87171;    --st-critico-bg:rgba(248,113,113,.14);   --st-critico-bd:rgba(248,113,113,.38);
    --st-cancelado:#94a3b8;  --st-cancelado-bg:rgba(148,163,184,.14); --st-cancelado-bd:rgba(148,163,184,.35);
  }

  html{ font-family:'Inter',system-ui,sans-serif; }
  body{ background:var(--s0); color:var(--ink1); font-size:14px; }
  [x-cloak]{ display:none !important; }

  /* Foco visible por teclado — siempre */
  :focus-visible{ outline:2px solid var(--focus); outline-offset:2px; border-radius:4px; }

  /* Movimiento con propósito: 150–250ms ease-out */
  .tr-150{ transition:all .15s ease-out; }
  .tr-200{ transition:all .2s ease-out; }
  .tr-250{ transition:all .25s ease-out; }
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
  }

  /* Scrollbars sobrios */
  ::-webkit-scrollbar{ width:10px; height:10px; }
  ::-webkit-scrollbar-thumb{ background:var(--line-strong); border-radius:6px; border:2px solid var(--s0); }
  ::-webkit-scrollbar-track{ background:transparent; }

  /* Datos técnicos siempre en mono con cifras tabulares */
  .mono{ font-family:'JetBrains Mono',monospace; font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
  `;
  const el = document.createElement('style');
  el.id = 'tokens-css';
  el.textContent = css;
  document.head.appendChild(el);
})();
