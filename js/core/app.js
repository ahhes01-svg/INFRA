(function () {
/* ============================================================================
 * app.js — Arranque de la aplicación · NettOps Perú
 *
 * Punto de entrada único. Resuelve la sesión, monta el marco una sola vez,
 * arranca Alpine y entrega el control al enrutador, que descarga cada sección
 * bajo demanda.
 * ==========================================================================*/

const Router = NettOps.router;
const Shell = NettOps.shell;
const { cargar } = NettOps.deps;

const ALPINE_CDN = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js';

/* ── API global para las vistas ───────────────────────────────────────────*/
let params = {};

window.App = {
  ir: Router.ir,
  reemplazar: Router.reemplazar,
  setParams: p => { params = p; },
  params: () => params,
  param: (k, def = null) => (k in params ? params[k] : def),
  rolActual: () => (window.Alpine && Alpine.store('ui') ? Alpine.store('ui').role : 'admin'),
  ruta: Router.rutaActual,
};

function cargarScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.defer = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* ── Sesión y datos ───────────────────────────────────────────────────────*/
async function prepararDatos() {
  let estado = { modoDemo: true, sesion: null };
  try {
    estado = await window.API.iniciar();
  } catch (e) {
    console.error('Fallo al iniciar la conexión:', e);
  }

  if (estado.modoDemo) {
    // Sin backend: traemos el conjunto de demostración solo ahora
    await cargarScript('js/demo/datos.js');
    return { demo: true };
  }

  if (!window.API.sesionActiva()) {
    location.replace('index.html');       // al login
    return null;
  }

  const r = await window.API.cargarTodo();
  return { demo: false, error: r.ok ? null : r.error };
}

/* ── Estado compartido de la interfaz ─────────────────────────────────────*/
function registrarStores(demo, errorCarga) {
  const perfil = window.API.miPerfil();
  const params = new URLSearchParams(location.search);
  const rolUrl = ['admin', 'supervisor', 'tecnico'].includes(params.get('role')) ? params.get('role') : 'admin';

  document.addEventListener('alpine:init', () => {
    Alpine.store('db', window.DB);

    Alpine.store('ui', {
      role: (!demo && perfil) ? perfil.rol : rolUrl,
      demo,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      view: errorCarga ? 'error' : 'data',
      errorCarga: errorCarga || '',
      sidebarOpen: false,
      bellOpen: false,
      hoy: window.HOY,
      pagina: '',
      titulo: '',

      // Los enlaces heredados siguen funcionando: devuelve una ruta del enrutador
      href(page) { return '#/' + page; },

      rolLabel() { return Shell.ROLES[this.role]; },
      puede(p) { return Shell.PERMISOS[this.role].includes(p); },
      nav() { return Shell.NAV.filter(n => n.roles.includes(this.role)); },

      setTheme(t) {
        this.theme = t;
        document.documentElement.classList.toggle('dark', t === 'dark');
        try { localStorage.setItem('nettops:tema', t); } catch (e) {}
        window.dispatchEvent(new CustomEvent('app:theme'));
      },
      setRole(r) {
        if (!this.demo) {
          Alpine.store('toasts').push('info', 'El rol lo define tu cuenta',
            'Pide al administrador que cambie tu rol desde Configuración.');
          return;
        }
        this.role = r;
        const item = Shell.NAV.find(n => n.id === this.pagina);
        if (item && !item.roles.includes(r)) {
          Router.ir(r === 'tecnico' ? 'mi-jornada' : 'dashboard');
        } else {
          Router.resolver();     // vuelve a montar con los permisos nuevos
        }
      },
      setView(v) { this.view = v; },
      async cerrarSesion() {
        if (window.API) await window.API.salir();
        location.href = 'index.html';
      },
      get tecnicoActual() { return window.CALC.tecnico(Alpine.store('db').sesion.tecnicoDemoId); },
    });
  });
}

/* ── Arranque ─────────────────────────────────────────────────────────────*/
(async function arrancar() {
  // Tema guardado, antes de pintar nada
  try {
    const t = localStorage.getItem('nettops:tema');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}

  await cargar('supabase');
  const estado = await prepararDatos();
  if (!estado) return;                    // se fue al login

  registrarStores(estado.demo, estado.error);

  Shell.inyectarCss();
  document.getElementById('app').innerHTML = Shell.html();

  await cargarScript(ALPINE_CDN);

  // Espera a que Alpine esté listo para que el enrutador pueda registrar vistas
  await new Promise(res => {
    if (window.Alpine) return res();
    document.addEventListener('alpine:initialized', res, { once: true });
  });

  await Router.iniciar(document.getElementById('vista'), (pagina, vista) => {
    const ui = Alpine.store('ui');
    ui.pagina = pagina;
    ui.titulo = vista.title || '';
    ui.view = 'data';                     // cada sección arranca con datos
    document.title = (vista.title ? vista.title + ' · ' : '') + 'NettOps Perú';
    // El marco móvil (sin barra lateral) es para el técnico en campo. Si un
    // gestor abre esa vista conserva su navegación habitual.
    document.body.classList.toggle('movil', pagina === 'mi-jornada' && ui.role === 'tecnico');
  });

  // Cuando el navegador esté ocioso, adelanta las secciones más visitadas
  Router.precargar(['actividades', 'bts', 'incidencias']);
})();
})();
