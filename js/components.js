/* ============================================================================
 * components.js — Componentes reutilizables · NettOps Perú
 * Construidos una sola vez; ningún módulo define estilos propios.
 *
 * Contiene:
 *  1. CSS de componentes (botón, badge, tarjeta, tabla, modal, drawer, campo,
 *     tabs, progreso, avatar, menú contextual, toast, tooltip, skeleton)
 *  2. UI.* — generadores de HTML (iconos, botones, badges, KPI, avatar,
 *     estados vacío/error, skeletons)
 *  3. Componentes Alpine (dataTable, modal, drawer, tabs, dateRange, ctxMenu,
 *     field) + directivas (x-tooltip, x-countup) + store de toasts
 *  4. Utilidades de gráficos (Chart.js con tema del sistema)
 * ==========================================================================*/

/* ============================== 1. CSS ====================================*/
(function injectComponentCss() {
  const css = `
  /* ---------- Botón: 4 variantes × 3 tamaños ---------- */
  .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px;
    font-weight:500; border-radius:6px; border:1px solid transparent; cursor:pointer;
    white-space:nowrap; user-select:none; transition:background .15s ease-out,border-color .15s ease-out,color .15s ease-out,box-shadow .15s ease-out,transform .1s ease-out; }
  .ui-btn:active:not(:disabled){ transform:translateY(1px); }
  .ui-btn:disabled{ opacity:.45; cursor:not-allowed; }
  .ui-btn-sm{ height:28px; padding:0 10px; font-size:11px; }
  .ui-btn-md{ height:36px; padding:0 14px; font-size:13px; }
  .ui-btn-lg{ height:44px; padding:0 20px; font-size:14px; }
  .ui-btn-primary{ background:#2563eb; color:#fff; }
  .ui-btn-primary:hover:not(:disabled){ background:#1d4ed8; }
  .dark .ui-btn-primary{ background:#3b82f6; }
  .dark .ui-btn-primary:hover:not(:disabled){ background:#60a5fa; color:#0f172a; }
  .ui-btn-secondary{ background:var(--s1); color:var(--ink1); border-color:var(--line-strong); box-shadow:0 1px 2px rgba(2,6,23,.06); }
  .ui-btn-secondary:hover:not(:disabled){ background:var(--s2); border-color:var(--ink3); }
  .ui-btn-ghost{ background:transparent; color:var(--ink2); }
  .ui-btn-ghost:hover:not(:disabled){ background:var(--s3); color:var(--ink1); }
  .ui-btn-danger{ background:var(--st-critico); color:#fff; }
  .dark .ui-btn-danger{ color:#0f172a; }
  .ui-btn-danger:hover:not(:disabled){ filter:brightness(.92); }
  .ui-btn .spin{ display:none; }
  .ui-btn[data-loading="1"]{ pointer-events:none; opacity:.75; }
  .ui-btn[data-loading="1"] .spin{ display:inline-block; }
  .ui-btn[data-loading="1"] .btn-ico{ display:none; }
  .spin{ width:14px; height:14px; border:2px solid currentColor; border-right-color:transparent;
    border-radius:50%; animation:uispin .7s linear infinite; }
  @keyframes uispin{ to{ transform:rotate(360deg);} }

  /* ---------- Badge de estado (nunca solo color: punto + texto) ---------- */
  .ui-badge{ display:inline-flex; align-items:center; gap:5px; height:20px; padding:0 8px;
    border-radius:999px; font-size:11px; font-weight:600; border:1px solid; letter-spacing:.01em;
    transition:background .2s ease-out,color .2s ease-out,border-color .2s ease-out; }
  .ui-badge .dot{ width:6px; height:6px; border-radius:2px; background:currentColor; flex:none; }
  .st-completado{ color:var(--st-completado); background:var(--st-completado-bg); border-color:var(--st-completado-bd); }
  .st-ejecucion { color:var(--st-ejecucion);  background:var(--st-ejecucion-bg);  border-color:var(--st-ejecucion-bd); }
  .st-pendiente { color:var(--st-pendiente);  background:var(--st-pendiente-bg);  border-color:var(--st-pendiente-bd); }
  .st-critico   { color:var(--st-critico);    background:var(--st-critico-bg);    border-color:var(--st-critico-bd); }
  .st-cancelado { color:var(--st-cancelado);  background:var(--st-cancelado-bg);  border-color:var(--st-cancelado-bd); }

  /* ---------- Tarjeta / KPI ---------- */
  .ui-card{ background:var(--s1); border:1px solid var(--line); border-radius:8px; box-shadow:0 1px 2px rgba(2,6,23,.06); }
  .ui-kpi{ padding:14px 16px; display:flex; flex-direction:column; gap:6px; min-width:0; }
  .ui-kpi .kpi-label{ font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--ink3); display:flex; align-items:center; gap:6px; }
  .ui-kpi .kpi-value{ font-family:'JetBrains Mono',monospace; font-variant-numeric:tabular-nums; font-size:24px; line-height:30px; font-weight:600; color:var(--ink1); }
  .ui-kpi .kpi-delta{ font-size:11px; display:flex; align-items:center; gap:4px; color:var(--ink2); }

  /* ---------- Tabla de datos ---------- */
  .ui-table-wrap{ overflow-x:auto; border:1px solid var(--line); border-radius:8px; background:var(--s1); }
  .ui-table{ width:100%; border-collapse:separate; border-spacing:0; font-size:13px; }
  .ui-table thead th{ position:sticky; top:0; z-index:2; background:var(--s2); color:var(--ink2);
    font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; text-align:left;
    padding:8px 12px; border-bottom:1px solid var(--line); white-space:nowrap; }
  .ui-table thead th.sortable{ cursor:pointer; user-select:none; }
  .ui-table thead th.sortable:hover{ color:var(--ink1); }
  .ui-table tbody td{ padding:9px 12px; border-bottom:1px solid var(--line); color:var(--ink1); vertical-align:middle; }
  .ui-table tbody tr{ background:var(--s1); transition:background .15s ease-out; animation:rowIn .2s ease-out; }
  .ui-table tbody tr:hover{ background:var(--s2); }
  .ui-table tbody tr.is-selected{ background:var(--st-ejecucion-bg); }
  .ui-table tbody tr:last-child td{ border-bottom:none; }
  .ui-table .col-sticky{ position:sticky; left:0; z-index:1; background:inherit; box-shadow:inset -1px 0 0 var(--line); }
  .ui-table thead .col-sticky{ z-index:3; background:var(--s2); }
  .ui-table tbody tr .row-actions{ opacity:0; transition:opacity .15s ease-out; }
  .ui-table tbody tr:hover .row-actions,
  .ui-table tbody tr:focus-within .row-actions{ opacity:1; }
  @keyframes rowIn{ from{ opacity:0; transform:translateY(3px);} to{ opacity:1; transform:none;} }

  /* ---------- Barra de progreso ---------- */
  .ui-progress{ display:flex; align-items:center; gap:8px; min-width:96px; }
  .ui-progress .track{ flex:1; height:6px; border-radius:999px; background:var(--s3); overflow:hidden; }
  .ui-progress .fill{ height:100%; border-radius:999px; background:#2563eb; transition:width .25s ease-out, background .2s ease-out; }
  .dark .ui-progress .fill{ background:#3b82f6; }
  .ui-progress .fill.st-completado{ background:var(--st-completado); }
  .ui-progress .fill.st-critico{ background:var(--st-critico); }
  .ui-progress .pct{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink2); min-width:34px; text-align:right; font-variant-numeric:tabular-nums; }

  /* ---------- Avatar ---------- */
  .ui-avatar{ position:relative; flex:none; border-radius:999px; overflow:hidden; background:var(--s3);
    color:var(--ink2); display:inline-flex; align-items:center; justify-content:center; font-weight:600;
    border:1px solid var(--line-strong); }
  .ui-avatar img{ width:100%; height:100%; object-fit:cover; }
  .ui-avatar-24{ width:24px; height:24px; font-size:9px; }
  .ui-avatar-32{ width:32px; height:32px; font-size:11px; }
  .ui-avatar-40{ width:40px; height:40px; font-size:13px; }
  .ui-avatar-64{ width:64px; height:64px; font-size:18px; }
  .ui-avatar-stack{ display:inline-flex; }
  .ui-avatar-stack .ui-avatar{ margin-left:-8px; box-shadow:0 0 0 2px var(--s1); }
  .ui-avatar-stack .ui-avatar:first-child{ margin-left:0; }

  /* ---------- Campo de formulario ---------- */
  .ui-label{ display:block; font-size:11px; font-weight:600; color:var(--ink2); margin-bottom:4px;
    text-transform:uppercase; letter-spacing:.04em; }
  .ui-input, .ui-select, .ui-textarea{ width:100%; background:var(--s1); color:var(--ink1);
    border:1px solid var(--line-strong); border-radius:6px; font-size:13px; padding:0 10px; height:36px;
    transition:border-color .15s ease-out, box-shadow .15s ease-out; }
  .ui-textarea{ height:auto; padding:8px 10px; min-height:72px; resize:vertical; }
  .ui-input::placeholder, .ui-textarea::placeholder{ color:var(--ink3); }
  .ui-input:focus, .ui-select:focus, .ui-textarea:focus{ outline:none; border-color:var(--focus); box-shadow:0 0 0 3px var(--st-ejecucion-bg); }
  .ui-input.is-invalid, .ui-textarea.is-invalid{ border-color:var(--st-critico); box-shadow:0 0 0 3px var(--st-critico-bg); }
  .ui-input.is-valid{ border-color:var(--st-completado-bd); }
  .ui-help{ font-size:11px; color:var(--ink3); margin-top:4px; }
  .ui-error{ font-size:11px; color:var(--st-critico); margin-top:4px; display:flex; gap:4px; align-items:center; }
  .ui-select{ appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:30px; }
  input[type="date"].ui-input, input[type="time"].ui-input{ font-family:'JetBrains Mono',monospace; font-size:12px; }
  .dark input[type="date"], .dark input[type="time"]{ color-scheme:dark; }
  .ui-check{ width:16px; height:16px; accent-color:#2563eb; cursor:pointer; }

  /* ---------- Tabs ---------- */
  .ui-tabs{ display:flex; gap:2px; border-bottom:1px solid var(--line); overflow-x:auto; scrollbar-width:none; }
  .ui-tabs::-webkit-scrollbar{ display:none; }
  .ui-tab{ padding:8px 12px; font-size:13px; font-weight:500; color:var(--ink2); border-bottom:2px solid transparent;
    cursor:pointer; white-space:nowrap; transition:color .15s ease-out, border-color .15s ease-out; background:none; border-top:none; border-left:none; border-right:none; }
  .ui-tab:hover{ color:var(--ink1); }
  .ui-tab.is-active{ color:#2563eb; border-bottom-color:#2563eb; }
  .dark .ui-tab.is-active{ color:#60a5fa; border-bottom-color:#60a5fa; }

  /* ---------- Modal ---------- */
  .ui-backdrop{ position:fixed; inset:0; background:rgba(2,6,23,.55); z-index:70; backdrop-filter:blur(2px); }
  .ui-modal{ position:fixed; inset:0; z-index:71; display:flex; align-items:flex-start; justify-content:center;
    padding:48px 16px; overflow-y:auto; }
  .ui-modal-box{ background:var(--s1); border:1px solid var(--line); border-radius:10px; box-shadow:0 12px 32px rgba(2,6,23,.22);
    width:100%; max-width:520px; }
  .ui-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--line); }
  .ui-modal-body{ padding:16px; }
  .ui-modal-foot{ display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid var(--line); background:var(--s2); border-radius:0 0 10px 10px; }

  /* ---------- Panel lateral deslizante ---------- */
  .ui-drawer{ position:fixed; top:0; right:0; bottom:0; width:100%; max-width:440px; background:var(--s1);
    border-left:1px solid var(--line); box-shadow:0 12px 32px rgba(2,6,23,.22); z-index:71; display:flex; flex-direction:column; }
  .ui-drawer-head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--line); flex:none; }
  .ui-drawer-body{ flex:1; overflow-y:auto; padding:16px; }
  .ui-drawer-foot{ padding:12px 16px; border-top:1px solid var(--line); display:flex; gap:8px; justify-content:flex-end; background:var(--s2); flex:none; }

  /* ---------- Menú contextual / dropdown ---------- */
  .ui-menu{ position:absolute; min-width:180px; background:var(--s1); border:1px solid var(--line);
    border-radius:8px; box-shadow:0 4px 12px rgba(2,6,23,.10); padding:4px; z-index:60; }
  .ui-menu-item{ display:flex; align-items:center; gap:8px; width:100%; text-align:left; padding:7px 10px;
    font-size:13px; color:var(--ink1); border-radius:5px; cursor:pointer; background:none; border:none; transition:background .15s ease-out; }
  .ui-menu-item:hover{ background:var(--s2); }
  .ui-menu-item.is-danger{ color:var(--st-critico); }
  .ui-menu-sep{ height:1px; background:var(--line); margin:4px 6px; }

  /* ---------- Toast ---------- */
  .ui-toasts{ position:fixed; bottom:16px; right:16px; z-index:90; display:flex; flex-direction:column; gap:8px; max-width:360px; }
  .ui-toast{ display:flex; gap:10px; align-items:flex-start; background:var(--s1); border:1px solid var(--line-strong);
    border-radius:8px; box-shadow:0 12px 32px rgba(2,6,23,.22); padding:10px 12px; font-size:13px; }
  .ui-toast .t-bar{ width:3px; align-self:stretch; border-radius:2px; flex:none; }

  /* ---------- Tooltip ---------- */
  .ui-tooltip{ position:fixed; z-index:95; background:var(--ink1); color:var(--s1); font-size:11px; font-weight:500;
    padding:4px 8px; border-radius:5px; pointer-events:none; max-width:260px; box-shadow:0 4px 12px rgba(2,6,23,.10);
    opacity:0; transform:translateY(2px); transition:opacity .15s ease-out, transform .15s ease-out; }
  .ui-tooltip.show{ opacity:1; transform:none; }

  /* ---------- Skeleton (con la forma del contenido, nunca spinners) ---------- */
  .ui-skel{ position:relative; overflow:hidden; background:var(--s3); border-radius:6px; }
  .ui-skel::after{ content:''; position:absolute; inset:0;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
    animation:shimmer 1.4s ease-out infinite; }
  .dark .ui-skel::after{ background:linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent); }
  @keyframes shimmer{ from{ transform:translateX(-100%);} to{ transform:translateX(100%);} }

  /* ---------- Estado vacío / error ---------- */
  .ui-empty{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
    padding:48px 24px; gap:8px; color:var(--ink2); }
  .ui-empty svg{ color:var(--ink3); }

  /* ---------- Transiciones Alpine ---------- */
  .fade-enter{ transition:opacity .2s ease-out; } .fade-enter-start{ opacity:0; }
  .pop-enter{ transition:opacity .2s ease-out, transform .2s ease-out; }
  .pop-enter-start{ opacity:0; transform:scale(.97) translateY(4px); }
  .slide-enter{ transition:transform .25s ease-out; } .slide-enter-start{ transform:translateX(100%); }
  .slide-leave{ transition:transform .2s ease-out; } .slide-leave-end{ transform:translateX(100%); }

  /* ---------- FullCalendar: adaptación al sistema ---------- */
  .fc{ --fc-border-color:var(--line); --fc-page-bg-color:transparent; --fc-neutral-bg-color:var(--s2);
    --fc-today-bg-color:var(--st-ejecucion-bg); font-size:12px; }
  .fc .fc-toolbar-title{ font-size:16px; font-weight:600; color:var(--ink1); }
  .fc .fc-button{ background:var(--s1); border:1px solid var(--line-strong); color:var(--ink1); font-size:12px; }
  .fc .fc-button:hover{ background:var(--s2); }
  .fc .fc-button-primary:not(:disabled).fc-button-active,
  .fc .fc-button-primary:not(:disabled):active{ background:#2563eb; border-color:#2563eb; color:#fff; }
  .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number, .fc .fc-timegrid-slot-label{ color:var(--ink2); }
  .fc-theme-standard td, .fc-theme-standard th{ border-color:var(--line); }
  .fc .fc-event{ border-radius:4px; font-size:11px; border:none; padding:1px 4px; cursor:pointer; }
  .fc-event.ev-conflicto{ outline:2px dashed var(--st-critico); outline-offset:1px; }
  .fc .fc-highlight{ background:var(--st-ejecucion-bg); }
  /* Eventos por estado: fondo suave + borde izquierdo saturado, texto siempre legible */
  .fc-event.st-ev-completado{ background:var(--st-completado-bg) !important; border-left:3px solid var(--st-completado) !important; color:var(--ink1) !important; }
  .fc-event.st-ev-ejecucion { background:var(--st-ejecucion-bg) !important;  border-left:3px solid var(--st-ejecucion) !important;  color:var(--ink1) !important; }
  .fc-event.st-ev-pendiente { background:var(--st-pendiente-bg) !important;  border-left:3px solid var(--st-pendiente) !important;  color:var(--ink1) !important; }
  .fc-event.st-ev-critico   { background:var(--st-critico-bg) !important;    border-left:3px solid var(--st-critico) !important;    color:var(--ink1) !important; }
  .fc-event.st-ev-cancelado { background:var(--st-cancelado-bg) !important;  border-left:3px solid var(--st-cancelado) !important;  color:var(--ink3) !important; text-decoration:line-through; }
  .fc-event .fc-event-time, .fc-event .fc-event-title{ font-family:'JetBrains Mono',monospace; font-size:10px; }
  .fc-event .fc-event-title{ font-family:'Inter',sans-serif; font-size:11px; }
  @keyframes evShake{ 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  .ev-rechazo{ animation:evShake .25s ease-out; outline:2px dashed var(--st-critico); }

  /* ---------- Leaflet: adaptación al sistema ---------- */
  .leaflet-container{ background:var(--s2); border-radius:8px; font-family:'Inter',sans-serif; }
  .dark .leaflet-tile{ filter:brightness(.7) contrast(1.1) saturate(.6); }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip{ background:var(--s1); color:var(--ink1); box-shadow:0 4px 12px rgba(2,6,23,.2); }
  .bts-pin{ display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:8px;
    color:#fff; font-size:10px; font-weight:700; border:2px solid #fff; box-shadow:0 2px 6px rgba(2,6,23,.35); }
  `;
  const el = document.createElement('style');
  el.id = 'components-css';
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ============================ 2. UI helpers ================================*/
window.UI = (function () {
  /* --- Iconos (trazo 24×24, estilo lucide) --- */
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    tower: '<path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 7v14"/><path d="m9 21 3-7 3 7"/><path d="M7.8 8.4a6 6 0 0 1 0-6.8M16.2 1.6a6 6 0 0 1 0 6.8"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    grid: '<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 13v4M12 9v8M17 5v12"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    phone: '<path d="M13.83 16.7a2 2 0 0 0 2.43.35l1.27-.75a2 2 0 0 1 2.42.3l1.48 1.48a2 2 0 0 1 .06 2.76 6.8 6.8 0 0 1-4.55 2.14C11.6 23.4.6 12.4 1.02 7.06A6.8 6.8 0 0 1 3.16 2.5a2 2 0 0 1 2.76.06L7.4 4.04a2 2 0 0 1 .3 2.42l-.75 1.27a2 2 0 0 0 .35 2.43z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    dots: '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    flag: '<path d="M4 22V4c0-.6.4-1 1-1 3.5 0 5 2 8.5 2 2 0 3-.5 4.5-1v11c-1.5.5-2.5 1-4.5 1-3.5 0-5-2-8.5-2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.81.01L6 21"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
    battery: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/>',
    calendarX: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    wifiOff: '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.24-2.76M19 12.9a9.96 9.96 0 0 0-2-1.48M2 8.8a15 15 0 0 1 4.17-2.65M22 8.8a15 15 0 0 0-11.29-3.76M2 2l20 20"/>',
  };
  function icon(name, size = 16, cls = '') {
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  /* --- Etiquetas y colores por estado --- */
  const ESTADOS = {
    completado:   { key: 'completado', label: 'Completado' },
    completada:   { key: 'completado', label: 'Completada' },
    aprobado:     { key: 'completado', label: 'Aprobado' },
    aprobada:     { key: 'completado', label: 'Aprobada' },
    resuelta:     { key: 'completado', label: 'Resuelta' },
    operativo:    { key: 'completado', label: 'Operativo' },
    disponible:   { key: 'completado', label: 'Disponible' },
    en_ejecucion: { key: 'ejecucion',  label: 'En ejecución' },
    en_campo:     { key: 'ejecucion',  label: 'En campo' },
    en_atencion:  { key: 'ejecucion',  label: 'En atención' },
    asignada:     { key: 'ejecucion',  label: 'Asignada' },
    pendiente:    { key: 'pendiente',  label: 'Pendiente' },
    en_revision:  { key: 'pendiente',  label: 'En revisión' },
    planificado:  { key: 'pendiente',  label: 'Planificado' },
    abierta:      { key: 'pendiente',  label: 'Abierta' },
    stock_bajo:   { key: 'pendiente',  label: 'Stock bajo' },
    retrasada:    { key: 'critico',    label: 'Retrasada' },
    retrasado:    { key: 'critico',    label: 'Retrasado' },
    critica:      { key: 'critico',    label: 'Crítica' },
    vencida:      { key: 'critico',    label: 'Vencida' },
    sin_stock:    { key: 'critico',    label: 'Sin stock' },
    alarma:       { key: 'critico',    label: 'En alarma' },
    cancelada:    { key: 'cancelado',  label: 'Cancelada' },
    cancelado:    { key: 'cancelado',  label: 'Cancelado' },
    inactivo:     { key: 'cancelado',  label: 'Inactivo' },
    descanso:     { key: 'cancelado',  label: 'Descanso' },
    alta:         { key: 'critico',    label: 'Alta' },
    media:        { key: 'pendiente',  label: 'Media' },
    baja:         { key: 'cancelado',  label: 'Baja' },
  };
  function estadoInfo(estado) {
    return ESTADOS[estado] || { key: 'cancelado', label: estado };
  }
  function badge(estado, labelOverride) {
    const e = estadoInfo(estado);
    return `<span class="ui-badge st-${e.key}" role="status"><span class="dot" aria-hidden="true"></span>${labelOverride || e.label}</span>`;
  }

  /* --- Botón --- */
  function btn({ label = '', variant = 'primary', size = 'md', icon: ic = null, attrs = '', loading = false, disabled = false, srOnly = false } = {}) {
    return `<button type="button" class="ui-btn ui-btn-${variant} ui-btn-${size}" ${attrs}
      ${disabled ? 'disabled' : ''} ${loading ? 'data-loading="1"' : ''}>
      <span class="spin" aria-hidden="true"></span>
      ${ic ? `<span class="btn-ico" aria-hidden="true">${icon(ic, size === 'sm' ? 13 : 15)}</span>` : ''}
      ${srOnly ? `<span class="sr-only">${label}</span>` : label ? `<span>${label}</span>` : ''}
    </button>`;
  }

  /* --- Avatar de técnico (con fallback a iniciales) --- */
  function iniciales(nombre) {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
  function avatar(t, size = 32, extraCls = '') {
    const ini = iniciales(t.nombre || '?');
    const img = t.foto
      ? `<img src="${t.foto}" alt="" loading="lazy" onerror="this.remove()">`
      : '';
    return `<span class="ui-avatar ui-avatar-${size} ${extraCls}" title="${t.nombre || ''}" aria-label="${t.nombre || ''}"><span aria-hidden="true" style="position:absolute">${ini}</span>${img}</span>`;
  }

  /* --- Barra / celda de progreso --- */
  function progress(pct, opts = {}) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    const fillCls = opts.estado === 'critico' ? 'st-critico' : (pct >= 100 ? 'st-completado' : '');
    return `<div class="ui-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="track"><div class="fill ${fillCls}" style="width:${pct}%"></div></div>
      <span class="pct">${pct}%</span>
    </div>`;
  }

  /* --- Tarjeta de indicador --- */
  function kpi({ label, value, icon: ic, delta, deltaDir, estado, mono = true, countTo = null }) {
    const deltaHtml = delta
      ? `<span class="kpi-delta"><span class="${deltaDir === 'up' ? 'text-[var(--st-completado)]' : deltaDir === 'down' ? 'text-[var(--st-critico)]' : ''}" style="display:inline-flex;align-items:center;gap:2px">${deltaDir === 'up' ? icon('arrowUp', 11) : deltaDir === 'down' ? icon('arrowDown', 11) : ''}${delta}</span></span>`
      : '';
    const color = estado ? `style="color:var(--st-${estado})"` : '';
    return `<div class="ui-card ui-kpi">
      <span class="kpi-label">${ic ? icon(ic, 13) : ''}${label}</span>
      <span class="kpi-value" ${color} ${countTo !== null ? `x-countup="${countTo}"` : ''}>${value}</span>
      ${deltaHtml}
    </div>`;
  }

  /* --- Skeletons con la forma del contenido real --- */
  const skel = {
    line: (w = '100%', h = 12) => `<div class="ui-skel" style="width:${w};height:${h}px"></div>`,
    kpis: (n = 4) => Array.from({ length: n }, () => `
      <div class="ui-card ui-kpi" aria-hidden="true">
        <div class="ui-skel" style="width:60%;height:10px"></div>
        <div class="ui-skel" style="width:45%;height:26px"></div>
        <div class="ui-skel" style="width:70%;height:10px"></div>
      </div>`).join(''),
    table: (rows = 6, cols = 5) => `
      <div class="ui-table-wrap" aria-hidden="true"><table class="ui-table"><thead><tr>
      ${Array.from({ length: cols }, () => `<th><div class="ui-skel" style="width:70px;height:10px"></div></th>`).join('')}
      </tr></thead><tbody>
      ${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, (_, i) =>
        `<td><div class="ui-skel" style="width:${i === 0 ? '110px' : (60 + ((i * 37) % 60)) + 'px'};height:12px"></div></td>`).join('')}</tr>`).join('')}
      </tbody></table></div>`,
    chart: (h = 220) => `
      <div class="p-4" aria-hidden="true">
        <div class="ui-skel mb-3" style="width:160px;height:12px"></div>
        <div class="flex items-end gap-2" style="height:${h - 40}px">
          ${[62, 40, 78, 52, 88, 34, 70, 58, 45, 80].map(v => `<div class="ui-skel flex-1" style="height:${v}%"></div>`).join('')}
        </div>
      </div>`,
    detail: () => `
      <div class="space-y-3 p-1" aria-hidden="true">
        <div class="flex items-center gap-3">
          <div class="ui-skel" style="width:64px;height:64px;border-radius:999px"></div>
          <div class="space-y-2 flex-1"><div class="ui-skel" style="width:40%;height:16px"></div><div class="ui-skel" style="width:60%;height:11px"></div></div>
        </div>
        ${[90, 75, 82, 60].map(w => `<div class="ui-skel" style="width:${w}%;height:12px"></div>`).join('')}
      </div>`,
    cards: (n = 3) => Array.from({ length: n }, () => `
      <div class="ui-card p-4 space-y-3" aria-hidden="true">
        <div class="ui-skel" style="width:50%;height:14px"></div>
        <div class="ui-skel" style="width:100%;height:11px"></div>
        <div class="ui-skel" style="width:80%;height:11px"></div>
        <div class="ui-skel" style="width:100%;height:6px;border-radius:999px"></div>
      </div>`).join(''),
  };

  /* --- Estado vacío --- */
  function emptyState({ icon: ic = 'inbox', title, desc = '', action = '' }) {
    return `<div class="ui-empty" role="status">
      ${icon(ic, 36)}
      <p class="font-semibold text-base text-ink-1">${title}</p>
      ${desc ? `<p class="text-sm max-w-sm">${desc}</p>` : ''}
      ${action ? `<div class="mt-2">${action}</div>` : ''}
    </div>`;
  }

  /* --- Estado de error --- */
  function errorState({ title = 'No se pudo cargar la información', desc = '', retryAttr = '' }) {
    return `<div class="ui-empty" role="alert">
      <span style="color:var(--st-critico)">${icon('alertCircle', 36)}</span>
      <p class="font-semibold text-base text-ink-1">${title}</p>
      ${desc ? `<p class="text-sm max-w-sm">${desc}</p>` : ''}
      <div class="mt-2">${btn({ label: 'Reintentar', variant: 'secondary', icon: 'refresh', attrs: retryAttr })}</div>
    </div>`;
  }

  /* --- Aviso "no disponible en el prototipo" --- */
  function protoNotice() {
    Alpine.store('toasts').push('info', 'Función no disponible en el prototipo', 'Esta acción existirá en el producto final.');
  }

  /* --- Formato --- */
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fmt = {
    fecha(iso) { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${y}`; },
    fechaCorta(iso) { if (!iso) return '—'; const [, m, d] = iso.split('-').map(Number); return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`; },
    diaLargo(iso) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return `${DIAS[dt.getDay()]} ${String(d).padStart(2, '0')} de ${MESES[m - 1]} de ${y}`; },
    hora(h) { return h || '—'; },
    coord(n) { return Number(n).toFixed(5); },
    num(n) { return Number(n).toLocaleString('es-PE'); },
    moneda(n) { return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 }); },
  };

  /* --- Gráficos: Chart.js con el tema del sistema --- */
  const chartRegistry = [];
  function chartTheme() {
    const dark = document.documentElement.classList.contains('dark');
    const T = window.TOKENS.chart;
    return {
      dark,
      series: dark ? T.dark : T.light,
      grid: dark ? T.grid.dark : T.grid.light,
      tick: dark ? T.tick.dark : T.tick.light,
      estado: Object.fromEntries(Object.entries(window.TOKENS.estado).map(([k, v]) => [k, dark ? v.dark : v.light])),
    };
  }
  function makeChart(canvas, buildCfg) {
    if (!window.Chart) return null;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    const build = () => {
      const th = chartTheme();
      const cfg = buildCfg(th);
      // Especificación de marcas: barras finas con extremos redondeados 4px,
      // líneas 2px, rejilla recesiva, leyenda con cajas pequeñas.
      cfg.options = cfg.options || {};
      cfg.options.responsive = true;
      cfg.options.maintainAspectRatio = false;
      cfg.options.animation = { duration: 250, easing: 'easeOutQuad' };
      const base = { color: th.tick };
      cfg.options.plugins = Object.assign({
        legend: { labels: { color: th.tick, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', padding: 14 } },
        tooltip: {
          backgroundColor: th.dark ? '#0f172a' : '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1',
          borderColor: th.grid, borderWidth: 1, cornerRadius: 6, padding: 10, displayColors: true,
          boxWidth: 8, boxHeight: 8, usePointStyle: true,
        },
      }, cfg.options.plugins || {});
      if (cfg.options.scales !== null && cfg.type !== 'doughnut' && cfg.type !== 'pie') {
        cfg.options.scales = Object.assign({
          x: { grid: { display: false }, ticks: base, border: { color: th.grid } },
          y: { grid: { color: th.grid }, ticks: base, border: { display: false }, beginAtZero: true },
        }, cfg.options.scales || {});
      }
      (cfg.data.datasets || []).forEach(ds => {
        if (cfg.type === 'bar') { ds.borderRadius = ds.borderRadius ?? 4; ds.maxBarThickness = ds.maxBarThickness ?? 22; ds.borderSkipped = 'start'; }
        if (cfg.type === 'line') { ds.borderWidth = ds.borderWidth ?? 2; ds.pointRadius = ds.pointRadius ?? 2.5; ds.pointHoverRadius = 5; ds.tension = ds.tension ?? 0.3; }
      });
      return cfg;
    };
    const chart = new Chart(canvas, build());
    const entry = { chart, rebuild: () => { const c = build(); chart.data = c.data; chart.options = c.options; chart.update(); } };
    chartRegistry.push(entry);
    return entry;
  }
  // Ante cambio de tema o de datos, re-tematizar / redibujar todos los gráficos
  window.addEventListener('app:theme', () => chartRegistry.forEach(e => e.rebuild()));
  window.addEventListener('app:data', () => chartRegistry.forEach(e => e.rebuild()));

  return { icon, badge, estadoInfo, btn, avatar, progress, kpi, skel, emptyState, errorState, protoNotice, fmt, iniciales, makeChart, chartTheme };
})();

/* ======================= 3. Componentes Alpine =============================*/
document.addEventListener('alpine:init', () => {

  /* --- Toasts --- */
  Alpine.store('toasts', {
    list: [],
    _id: 0,
    push(tipo, titulo, detalle = '') {
      const id = ++this._id;
      this.list.push({ id, tipo, titulo, detalle });
      setTimeout(() => this.close(id), 4200);
    },
    close(id) { this.list = this.list.filter(t => t.id !== id); },
  });

  /* --- Tabla de datos: orden, búsqueda, filtros, selección, paginación --- */
  Alpine.data('dataTable', (cfg = {}) => ({
    q: '',
    sortKey: cfg.sortKey || null,
    sortDir: cfg.sortDir || 'asc',
    page: 1,
    pageSize: cfg.pageSize || 10,
    filters: cfg.filters || {},
    selected: [],
    getRows: cfg.rows || (() => []),

    get filtered() {
      let rows = this.getRows();
      const q = this.q.trim().toLowerCase();
      if (q) rows = rows.filter(r => JSON.stringify(Object.values(r)).toLowerCase().includes(q));
      for (const [k, v] of Object.entries(this.filters)) {
        if (v !== '' && v !== null && v !== undefined) rows = rows.filter(r => String(r[k]) === String(v));
      }
      if (this.sortKey) {
        const k = this.sortKey, dir = this.sortDir === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
          const av = a[k], bv = b[k];
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          return String(av ?? '').localeCompare(String(bv ?? ''), 'es') * dir;
        });
      }
      return rows;
    },
    get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); },
    get paged() {
      if (this.page > this.totalPages) this.page = this.totalPages;
      return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
    },
    get rangeLabel() {
      const n = this.filtered.length;
      if (!n) return '0 registros';
      const a = (this.page - 1) * this.pageSize + 1;
      const b = Math.min(this.page * this.pageSize, n);
      return `${a}–${b} de ${n}`;
    },
    sortBy(k) {
      if (this.sortKey === k) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      else { this.sortKey = k; this.sortDir = 'asc'; }
    },
    sortIcon(k) {
      if (this.sortKey !== k) return '';
      return this.sortDir === 'asc' ? '↑' : '↓';
    },
    toggleSel(id) {
      this.selected = this.selected.includes(id) ? this.selected.filter(x => x !== id) : [...this.selected, id];
    },
    isSel(id) { return this.selected.includes(id); },
    get allPageSel() { return this.paged.length > 0 && this.paged.every(r => this.selected.includes(r.id)); },
    toggleAll() {
      if (this.allPageSel) this.selected = this.selected.filter(id => !this.paged.some(r => r.id === id));
      else this.selected = [...new Set([...this.selected, ...this.paged.map(r => r.id)])];
    },
    resetFilters() { this.q = ''; this.filters = Object.fromEntries(Object.keys(this.filters).map(k => [k, ''])); this.page = 1; },
  }));

  /* --- Modal (Escape para cerrar, foco inicial) --- */
  Alpine.data('modal', () => ({
    open: false,
    show() { this.open = true; this.$nextTick(() => { const f = this.$root.querySelector('.ui-modal-box [autofocus], .ui-modal-box input, .ui-modal-box button'); f && f.focus(); }); },
    hide() { this.open = false; },
  }));

  /* --- Selector de rango de fechas con presets --- */
  Alpine.data('dateRange', (hoy) => ({
    open: false,
    preset: 'hoy',
    desde: hoy, hasta: hoy,
    presets: [
      { id: 'hoy', label: 'Hoy' },
      { id: '7d', label: 'Últimos 7 días' },
      { id: '30d', label: 'Últimos 30 días' },
      { id: 'mes', label: 'Este mes' },
      { id: 'custom', label: 'Personalizado' },
    ],
    aplicar(id) {
      this.preset = id;
      const d = new Date(hoy + 'T12:00:00');
      const iso = (x) => x.toISOString().slice(0, 10);
      if (id === 'hoy') { this.desde = hoy; this.hasta = hoy; }
      if (id === '7d') { const a = new Date(d); a.setDate(a.getDate() - 6); this.desde = iso(a); this.hasta = hoy; }
      if (id === '30d') { const a = new Date(d); a.setDate(a.getDate() - 29); this.desde = iso(a); this.hasta = hoy; }
      if (id === 'mes') { this.desde = hoy.slice(0, 8) + '01'; this.hasta = hoy; }
      if (id !== 'custom') this.open = false;
    },
    get label() {
      const p = this.presets.find(p => p.id === this.preset);
      return this.preset === 'custom' ? `${UI.fmt.fechaCorta(this.desde)} – ${UI.fmt.fechaCorta(this.hasta)}` : p.label;
    },
  }));

  /* --- Menú contextual --- */
  Alpine.data('ctxMenu', () => ({
    open: false, x: 0, y: 0, payload: null,
    show(ev, payload = null) {
      ev.preventDefault();
      this.payload = payload;
      this.x = Math.min(ev.clientX, window.innerWidth - 200);
      this.y = Math.min(ev.clientY, window.innerHeight - 180);
      this.open = true;
    },
  }));

  /* --- Campo con validación en vivo --- */
  Alpine.data('field', (cfg = {}) => ({
    value: cfg.value ?? '',
    touched: false,
    rules: cfg.rules || [],
    get error() {
      for (const r of this.rules) {
        if (r.req && !String(this.value).trim()) return r.msg || 'Este campo es obligatorio';
        if (r.min && String(this.value).length > 0 && String(this.value).length < r.min) return r.msg || `Mínimo ${r.min} caracteres`;
        if (r.pattern && String(this.value) && !new RegExp(r.pattern).test(this.value)) return r.msg || 'Formato inválido';
      }
      return '';
    },
    get valid() { return this.touched && !this.error && String(this.value).trim() !== ''; },
    get invalid() { return this.touched && !!this.error; },
  }));

  /* --- Directiva x-tooltip --- */
  let tipEl = null;
  Alpine.directive('tooltip', (el, { expression }, { evaluateLater, cleanup }) => {
    const getText = evaluateLater(expression);
    function show() {
      getText(text => {
        if (!text) return;
        if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ui-tooltip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
        tipEl.textContent = text;
        const r = el.getBoundingClientRect();
        tipEl.style.left = Math.max(8, Math.min(r.left + r.width / 2 - tipEl.offsetWidth / 2, window.innerWidth - 8 - tipEl.offsetWidth)) + 'px';
        requestAnimationFrame(() => {
          tipEl.style.left = Math.max(8, Math.min(r.left + r.width / 2 - tipEl.offsetWidth / 2, window.innerWidth - 8 - tipEl.offsetWidth)) + 'px';
          tipEl.style.top = (r.top - tipEl.offsetHeight - 6 < 8 ? r.bottom + 6 : r.top - tipEl.offsetHeight - 6) + 'px';
          tipEl.classList.add('show');
        });
      });
    }
    function hide() { tipEl && tipEl.classList.remove('show'); }
    el.addEventListener('mouseenter', show); el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show); el.addEventListener('blur', hide);
    cleanup(() => { hide(); });
  });

  /* --- Directiva x-countup: la cifra cuenta hasta el nuevo valor --- */
  Alpine.directive('countup', (el, { expression }, { evaluateLater, effect }) => {
    const getVal = evaluateLater(expression);
    let current = null;
    effect(() => {
      getVal(v => {
        const target = Number(v) || 0;
        const suffix = el.dataset.suffix || '';
        if (current === null) { current = target; el.textContent = target.toLocaleString('es-PE') + suffix; return; }
        if (current === target) return;
        const from = current, delta = target - from, t0 = performance.now(), dur = 250;
        function step(t) {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 2); // ease-out
          el.textContent = Math.round(from + delta * eased).toLocaleString('es-PE') + suffix;
          if (p < 1) requestAnimationFrame(step); else current = target;
        }
        requestAnimationFrame(step);
      });
    });
  });
});
