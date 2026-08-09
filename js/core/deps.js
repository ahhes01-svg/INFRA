/* ============================================================================
 * deps.js — Carga de librerías bajo demanda
 *
 * Chart.js, FullCalendar y Leaflet pesan juntos más de 650 KB. Antes viajaban
 * en cada carga de las páginas que los usaban; ahora se descargan la primera
 * vez que se entra a una vista que los necesita y quedan en memoria para el
 * resto de la sesión.
 * ==========================================================================*/

const CDN = {
  chart:    { js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js'], listo: () => !!window.Chart },
  calendar: { js: ['https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js'], listo: () => !!window.FullCalendar },
  mapa: {
    css: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'],
    js:  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'],
    listo: () => !!window.L,
  },
  // El agrupador de marcadores depende de Leaflet, así que se pide después
  mapaCluster: {
    css: ['https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
          'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'],
    js:  ['https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'],
    requiere: 'mapa',
    listo: () => !!(window.L && window.L.markerClusterGroup),
  },
  supabase: { js: ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'], listo: () => !!window.supabase },
};

const enCurso = new Map();   // nombre → promesa, para no pedir dos veces lo mismo

function cargarScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.async = false;          // respeta el orden dentro de un mismo grupo
    s.onload = res;
    s.onerror = () => rej(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

function cargarCss(href) {
  return new Promise(res => {
    if (document.querySelector(`link[href="${href}"]`)) return res();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = res;
    l.onerror = res;          // sin estilos la vista sigue siendo usable
    document.head.appendChild(l);
  });
}

export function cargar(nombre) {
  const dep = CDN[nombre];
  if (!dep) return Promise.resolve();
  if (dep.listo()) return Promise.resolve();
  if (enCurso.has(nombre)) return enCurso.get(nombre);

  const p = (async () => {
    if (dep.requiere) await cargar(dep.requiere);
    await Promise.all((dep.css || []).map(cargarCss));
    for (const src of dep.js || []) await cargarScript(src);
  })();

  enCurso.set(nombre, p);
  return p;
}

export function cargarVarias(nombres = []) {
  return Promise.all(nombres.map(cargar));
}
