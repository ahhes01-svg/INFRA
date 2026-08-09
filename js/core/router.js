(function () {
/* ============================================================================
 * router.js — Enrutado por hash con carga diferida de vistas
 *
 * Cada sección vive en js/views/<nombre>.js y se descarga con una etiqueta
 * script la primera vez que se visita. Al cambiar de sección no se recarga
 * el documento: el shell permanece y solo se reemplaza el contenido.
 *
 * Formato de ruta:  #/actividades          →  vista sin parámetros
 *                   #/bts-detalle&id=st-02 →  con parámetros
 * Se aceptan «&» y «?» como separador para no tener que reescribir los
 * enlaces heredados que concatenaban «&id=».
 * ==========================================================================*/

const { cargarVarias } = NettOps.deps;

const cache = new Map();      // nombre → módulo ya importado
let vistaActual = null;
let contenedor = null;
let alRenderizar = null;      // callback del shell (título, menú activo…)

function parsearRuta(hash = location.hash) {
  const limpio = hash.replace(/^#\/?/, '');
  if (!limpio) return { nombre: '', params: {} };
  const corte = limpio.search(/[?&]/);
  const nombre = corte === -1 ? limpio : limpio.slice(0, corte);
  const params = {};
  if (corte !== -1) {
    new URLSearchParams(limpio.slice(corte + 1).replace(/^&/, '')).forEach((v, k) => { params[k] = v; });
  }
  return { nombre: decodeURIComponent(nombre), params };
}

function rutaActual() { return parsearRuta(); }

function ir(nombre, params = {}) {
  const q = new URLSearchParams(params).toString();
  location.hash = '#/' + nombre + (q ? '&' + q : '');
}

function reemplazar(nombre, params = {}) {
  const q = new URLSearchParams(params).toString();
  location.replace('#/' + nombre + (q ? '&' + q : ''));
}

function cargarScriptVista(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('No se encontró el archivo de la sección'));
    document.head.appendChild(s);
  });
}

async function cargarVista(nombre) {
  if (cache.has(nombre)) return cache.get(nombre);
  await cargarScriptVista(`js/views/${nombre}.js`);
  const vista = NettOps.vistas[nombre];
  if (!vista) throw new Error('La sección no se registró correctamente');
  cache.set(nombre, vista);
  return vista;
}

/* Skeleton mientras llega el módulo de la vista: la pantalla nunca queda
   en blanco, ni siquiera con conexión lenta. */
function pintarCargando() {
  contenedor.innerHTML = `
    <div class="space-y-4" aria-busy="true" aria-live="polite">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${'<div class="ui-card ui-kpi"><div class="ui-skel" style="width:60%;height:10px"></div>' +
          '<div class="ui-skel" style="width:45%;height:26px"></div></div>'.repeat(4)}
      </div>
      <div class="ui-skel" style="height:280px;border-radius:8px"></div>
    </div>`;
}

function pintarError(nombre, e) {
  contenedor.innerHTML = `
    <div class="ui-card mt-8">
      <div class="ui-empty" role="alert">
        <span style="color:var(--st-critico)">${window.UI.icon('alertCircle', 36)}</span>
        <p class="font-semibold text-base text-ink-1">No se pudo abrir «${nombre}»</p>
        <p class="text-sm max-w-sm">${e.message || 'La sección no está disponible.'}</p>
        <div class="mt-2 flex gap-2">
          <button class="ui-btn ui-btn-secondary ui-btn-md" onclick="location.reload()">Reintentar</button>
          <a class="ui-btn ui-btn-ghost ui-btn-md" href="#/dashboard">Ir al inicio</a>
        </div>
      </div>
    </div>`;
}

async function resolver() {
  const { nombre, params } = rutaActual();
  const destino = nombre || (window.App.rolActual() === 'tecnico' ? 'mi-jornada' : 'dashboard');

  if (!nombre) { reemplazar(destino); return; }

  // Evita re-montar si solo cambian parámetros que la vista lee por sí misma
  const mismaVista = vistaActual && vistaActual.nombre === destino;

  let vista;
  try {
    if (!cache.has(destino)) pintarCargando();
    vista = await cargarVista(destino);
  } catch (e) {
    console.error('Error al cargar la vista', destino, e);
    pintarError(destino, e);
    return;
  }

  // Control de acceso por rol, igual que el menú lateral
  const rol = window.App.rolActual();
  if (vista.roles && !vista.roles.includes(rol)) {
    window.Alpine.store('toasts').push('warn', 'Sección no disponible para tu rol');
    reemplazar(rol === 'tecnico' ? 'mi-jornada' : 'dashboard');
    return;
  }

  // Las librerías pesadas solo se piden si esta vista las necesita
  if (vista.deps && vista.deps.length) {
    if (!mismaVista) pintarCargando();
    await cargarVarias(vista.deps);
  }

  window.App.setParams(params);

  // Registra el estado de la vista como componente de Alpine, con el mismo
  // nombre que ya usaban los x-data heredados (p. ej. dashboardPage).
  if (vista.state && vista.componente) {
    window.Alpine.data(vista.componente, vista.state);
  }

  vistaActual = { nombre: destino, vista };
  contenedor.innerHTML = vista.html;
  contenedor.scrollTop = 0;
  document.querySelector('#main-slot')?.scrollTo(0, 0);

  if (alRenderizar) alRenderizar(destino, vista);
}

function iniciar(el, onRender) {
  contenedor = el;
  alRenderizar = onRender;
  window.addEventListener('hashchange', resolver);
  return resolver();
}

/* Precarga en segundo plano las secciones más usadas, cuando el navegador
   está ocioso. Así el primer clic del usuario ya las encuentra en memoria. */
function precargar(nombres = []) {
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  idle(() => { nombres.forEach(n => { if (!cache.has(n)) cargarVista(n).catch(() => {}); }); });
}

NettOps.router = { parsearRuta, rutaActual, ir, reemplazar, resolver, iniciar, precargar };
})();
