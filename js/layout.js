/* ============================================================================
 * layout.js — Shell de la aplicación · NettOps Perú
 * Sidebar (14 módulos), navbar (rol, tema, simulador de estados, campana),
 * stores de Alpine y contenedor de toasts.
 *
 * Cada página declara en <body>:
 *   data-page="dashboard"  data-title="Dashboard"  [data-layout="bare|mobile"]
 * y envuelve su contenido en <main id="page">.
 *
 * El rol y el tema viajan por querystring (?role=&theme=) — sin localStorage.
 * ==========================================================================*/

(function () {
  const params = new URLSearchParams(location.search);
  const ROLE = ['admin', 'supervisor', 'tecnico'].includes(params.get('role')) ? params.get('role') : 'admin';
  const THEME = params.get('theme') === 'dark' ? 'dark' : 'light';

  const NAV = [
    { id: 'mi-jornada', label: 'Mi jornada', icon: 'smartphone', roles: ['tecnico'] },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'supervisor'] },
    { id: 'supervision', label: 'Supervisión', icon: 'shield', roles: ['supervisor', 'admin'] },
    { id: 'proyectos', label: 'Proyectos', icon: 'folder', roles: ['admin', 'supervisor'] },
    { id: 'bts', label: 'BTS / Sitios', icon: 'tower', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'tecnicos', label: 'Técnicos', icon: 'users', roles: ['admin', 'supervisor'] },
    { id: 'actividades', label: 'Actividades', icon: 'clipboard', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'agenda', label: 'Agenda', icon: 'calendar', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'control-diario', label: 'Control diario', icon: 'grid', roles: ['admin', 'supervisor'] },
    { id: 'incidencias', label: 'Incidencias', icon: 'alert', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'materiales', label: 'Materiales', icon: 'box', roles: ['admin'] },
    { id: 'evidencias', label: 'Evidencias', icon: 'camera', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'reportes', label: 'Reportes', icon: 'chart', roles: ['admin', 'supervisor'] },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', roles: ['admin', 'supervisor', 'tecnico'] },
    { id: 'historial', label: 'Historial', icon: 'history', roles: ['admin', 'supervisor'] },
    { id: 'configuracion', label: 'Configuración', icon: 'settings', roles: ['admin'] },
  ];

  const ROLES = { admin: 'Administrador', supervisor: 'Supervisor', tecnico: 'Técnico' };

  // Permisos gruesos por rol — los módulos consultan $store.ui.puede('...')
  const PERMISOS = {
    admin: ['crear', 'editar', 'eliminar', 'aprobar', 'asignar', 'exportar', 'configurar', 'campo'],
    supervisor: ['crear', 'editar', 'aprobar', 'asignar', 'exportar', 'campo'],
    tecnico: ['campo'],
  };

  function href(page) {
    return `${page}.html?role=${Alpine.store('ui').role}&theme=${Alpine.store('ui').theme}`;
  }

  document.addEventListener('alpine:init', () => {
    Alpine.store('db', window.DB);

    Alpine.store('ui', {
      role: ROLE,
      theme: THEME,
      view: 'data',            // data | loading | empty | error
      sidebarOpen: false,
      bellOpen: false,
      hoy: window.HOY,
      href,
      rolLabel() { return ROLES[this.role]; },
      puede(p) { return PERMISOS[this.role].includes(p); },
      nav() { return NAV.filter(n => n.roles.includes(this.role)); },
      setTheme(t) {
        this.theme = t;
        document.documentElement.classList.toggle('dark', t === 'dark');
        const u = new URL(location.href); u.searchParams.set('theme', t);
        history.replaceState(null, '', u);
        window.dispatchEvent(new CustomEvent('app:theme'));
      },
      setRole(r) {
        this.role = r;
        const page = document.body.dataset.page;
        const item = NAV.find(n => n.id === page);
        if (item && !item.roles.includes(r)) {
          // La página actual no existe para este rol: ir a su pantalla inicial
          location.href = href(r === 'tecnico' ? 'mi-jornada' : 'dashboard');
          return;
        }
        const u = new URL(location.href); u.searchParams.set('role', r);
        history.replaceState(null, '', u);
      },
      setView(v) { this.view = v; },
      // El técnico simulado al elegir el rol Técnico
      get tecnicoActual() { return window.CALC.tecnico(Alpine.store('db').sesion.tecnicoDemoId); },
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const layout = document.body.dataset.layout || 'shell';
    injectToasts();
    if (layout === 'bare') return;
    if (layout === 'mobile') { injectMobileChrome(); return; }
    injectShell();
  });

  /* ── Shell de escritorio ─────────────────────────────────────────────── */
  function injectShell() {
    const page = document.body.dataset.page || '';
    const title = document.body.dataset.title || '';
    const main = document.getElementById('page');
    if (!main) return;

    const shell = document.createElement('div');
    shell.setAttribute('x-data', '{}');
    shell.className = 'flex h-screen overflow-hidden';
    shell.innerHTML = `
      <!-- Sidebar -->
      <aside class="hidden lg:flex flex-col w-56 flex-none bg-surface-1 border-r border-line"
        :class="$store.ui.sidebarOpen && '!flex fixed inset-y-0 left-0 z-50 shadow-e3'" aria-label="Navegación principal">
        <div class="h-14 flex items-center gap-2.5 px-4 border-b border-line flex-none">
          <span class="text-brand-600 dark:text-brand-400">${UI.icon('tower', 22)}</span>
          <div class="leading-none">
            <p class="font-bold text-base tracking-tight">NettOps</p>
            <p class="text-xs text-ink-3 mono mt-0.5">Operaciones · Perú</p>
          </div>
          <button class="ui-btn ui-btn-ghost ui-btn-sm ml-auto lg:hidden" @click="$store.ui.sidebarOpen=false" aria-label="Cerrar menú">${UI.icon('x', 15)}</button>
        </div>
        <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <template x-for="item in $store.ui.nav()" :key="item.id">
            <a :href="$store.ui.href(item.id)"
              class="flex items-center gap-2.5 px-3 h-9 rounded-md text-sm font-medium tr-150"
              :class="item.id === '${page}'
                ? 'bg-brand-50 text-brand-700 dark:bg-slate-700/60 dark:text-brand-400'
                : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1'"
              :aria-current="item.id === '${page}' ? 'page' : false">
              <span x-html="UI.icon(item.icon, 16)"></span>
              <span x-text="item.label"></span>
              <template x-if="item.id === 'incidencias' && CALC.kpis().incidenciasAbiertas">
                <span class="ml-auto ui-badge st-critico" style="height:17px;padding:0 6px" x-text="CALC.kpis().incidenciasAbiertas"></span>
              </template>
              <template x-if="item.id === 'notificaciones' && CALC.kpis().noLeidas">
                <span class="ml-auto ui-badge st-ejecucion" style="height:17px;padding:0 6px" x-text="CALC.kpis().noLeidas"></span>
              </template>
            </a>
          </template>
        </nav>
        <div class="p-3 border-t border-line flex-none">
          <a href="design-system.html" class="flex items-center gap-2 text-xs text-ink-3 hover:text-ink-1 tr-150">${UI.icon('grid', 13)} Sistema de diseño</a>
          <p class="text-xs text-ink-3 mono mt-2">Prototipo v1.0 · ${window.HOY}</p>
        </div>
      </aside>
      <div class="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" x-show="$store.ui.sidebarOpen" x-cloak @click="$store.ui.sidebarOpen=false"></div>

      <!-- Columna principal -->
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-14 flex-none bg-surface-1 border-b border-line flex items-center gap-2 px-4">
          <button class="ui-btn ui-btn-ghost ui-btn-sm lg:hidden" @click="$store.ui.sidebarOpen=true" aria-label="Abrir menú">${UI.icon('menu', 17)}</button>
          <h1 class="text-lg font-semibold truncate">${title}</h1>

          <div class="ml-auto flex items-center gap-1.5">
            <!-- Simulador de estados de pantalla (demo) -->
            <div class="hidden md:flex items-center border border-line rounded-md p-0.5 bg-surface-2" role="group" aria-label="Simular estado de pantalla">
              ${['data|Datos', 'loading|Carga', 'empty|Vacío', 'error|Error'].map(o => {
                const [v, l] = o.split('|');
                return `<button class="px-2 h-6 rounded text-xs font-medium tr-150"
                  :class="$store.ui.view==='${v}' ? 'bg-surface-1 shadow-e1 text-ink-1' : 'text-ink-3 hover:text-ink-1'"
                  @click="$store.ui.setView('${v}')" :aria-pressed="$store.ui.view==='${v}'">${l}</button>`;
              }).join('')}
            </div>

            <!-- Selector de rol -->
            <label class="sr-only" for="rol-sel">Rol</label>
            <select id="rol-sel" class="ui-select ui-btn-sm !h-8 !w-auto text-sm" style="padding-right:26px"
              :value="$store.ui.role" @change="$store.ui.setRole($event.target.value)">
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="tecnico">Técnico</option>
            </select>

            <!-- Tema -->
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="$store.ui.setTheme($store.ui.theme==='dark'?'light':'dark')"
              :aria-label="$store.ui.theme==='dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
              <span x-html="$store.ui.theme==='dark' ? UI.icon('sun',15) : UI.icon('moon',15)"></span>
            </button>

            <!-- Campana -->
            <div class="relative">
              <button class="ui-btn ui-btn-ghost ui-btn-sm relative" @click="$store.ui.bellOpen=!$store.ui.bellOpen"
                :aria-expanded="$store.ui.bellOpen" aria-label="Notificaciones">
                ${UI.icon('bell', 16)}
                <template x-if="CALC.kpis().noLeidas">
                  <span class="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style="background:var(--st-critico)" x-text="CALC.kpis().noLeidas"></span>
                </template>
              </button>
              <div class="ui-menu shadow-e2 !fixed sm:!absolute right-2 sm:right-0 mt-1 !w-[340px] !p-0" style="top:auto"
                x-show="$store.ui.bellOpen" x-cloak @click.outside="$store.ui.bellOpen=false"
                x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
                <div class="flex items-center justify-between px-3 py-2 border-b border-line">
                  <p class="font-semibold text-sm">Notificaciones</p>
                  <button class="text-xs text-brand-600 dark:text-brand-400 hover:underline" @click="ACCIONES.marcarTodasLeidas()">Marcar todas leídas</button>
                </div>
                <div class="max-h-80 overflow-y-auto">
                  <template x-for="n in $store.db.notificaciones.slice(0,6)" :key="n.id">
                    <a :href="$store.ui.href(n.link.replace('.html',''))" class="flex gap-2.5 px-3 py-2.5 border-b border-line hover:bg-surface-2 tr-150"
                      :class="!n.leida && 'bg-surface-2'" @click="ACCIONES.marcarLeida(n.id)">
                      <span :style="'color:var(--st-'+(n.tipo==='completado'?'completado':n.tipo==='critico'?'critico':n.tipo==='ejecucion'?'ejecucion':'pendiente')+')'"
                        x-html="UI.icon(n.tipo==='critico'?'alertCircle':n.tipo==='completado'?'checkCircle':n.tipo==='ejecucion'?'zap':'info', 16)"></span>
                      <span class="flex-1 min-w-0">
                        <span class="text-sm font-medium block truncate" x-text="n.titulo"></span>
                        <span class="text-xs text-ink-2 block" x-text="n.detalle"></span>
                        <span class="text-xs text-ink-3 mono" x-text="n.fecha+' '+n.hora"></span>
                      </span>
                      <span class="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" :style="!n.leida ? 'background:var(--st-ejecucion)' : ''" aria-hidden="true"></span>
                    </a>
                  </template>
                </div>
                <a :href="$store.ui.href('notificaciones')" class="block text-center text-sm text-brand-600 dark:text-brand-400 py-2 hover:underline">Ver todas</a>
              </div>
            </div>

            <!-- Usuario -->
            <div class="flex items-center gap-2 pl-2 border-l border-line">
              ${UI.avatar({ nombre: 'María Alejandra Grados' }, 32)}
              <div class="hidden xl:block leading-tight">
                <p class="text-sm font-medium">M. Alejandra Grados</p>
                <p class="text-xs text-ink-3" x-text="$store.ui.rolLabel()"></p>
              </div>
            </div>
          </div>
        </header>
        <div id="main-slot" class="flex-1 overflow-y-auto"></div>
      </div>`;

    document.body.prepend(shell);
    shell.querySelector('#main-slot').appendChild(main);
    main.classList.add('p-4', 'lg:p-6', 'max-w-[1400px]', 'mx-auto', 'w-full');
  }

  /* ── Chrome móvil (Mi jornada) ───────────────────────────────────────── */
  function injectMobileChrome() {
    const header = document.createElement('header');
    header.setAttribute('x-data', '{}');
    header.className = 'sticky top-0 z-40 bg-surface-1 border-b border-line h-14 flex items-center gap-2 px-4';
    header.innerHTML = `
      <span class="text-brand-600 dark:text-brand-400">${UI.icon('tower', 20)}</span>
      <div class="leading-none">
        <p class="font-bold text-base">Mi jornada</p>
        <p class="text-xs text-ink-3 mono mt-0.5">${window.HOY}</p>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <select class="ui-select !h-9 !w-auto text-sm" style="padding-right:26px" aria-label="Rol"
          :value="$store.ui.role" @change="$store.ui.setRole($event.target.value)">
          <option value="admin">Administrador</option>
          <option value="supervisor">Supervisor</option>
          <option value="tecnico">Técnico</option>
        </select>
        <button class="ui-btn ui-btn-ghost ui-btn-md" style="min-width:44px" @click="$store.ui.setTheme($store.ui.theme==='dark'?'light':'dark')"
          :aria-label="$store.ui.theme==='dark' ? 'Modo claro' : 'Modo oscuro'">
          <span x-html="$store.ui.theme==='dark' ? UI.icon('sun',17) : UI.icon('moon',17)"></span>
        </button>
      </div>`;
    document.body.prepend(header);
  }

  /* ── Toasts globales ─────────────────────────────────────────────────── */
  function injectToasts() {
    const wrap = document.createElement('div');
    wrap.setAttribute('x-data', '{}');
    wrap.innerHTML = `
      <div class="ui-toasts" aria-live="polite">
        <template x-for="t in $store.toasts.list" :key="t.id">
          <div class="ui-toast" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start" role="status">
            <span class="t-bar" :style="'background:var(--st-'+({ok:'completado',error:'critico',warn:'pendiente',info:'ejecucion'})[t.tipo]+')'"></span>
            <span :style="'color:var(--st-'+({ok:'completado',error:'critico',warn:'pendiente',info:'ejecucion'})[t.tipo]+')'"
              x-html="UI.icon(({ok:'checkCircle',error:'alertCircle',warn:'alert',info:'info'})[t.tipo], 16)"></span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm" x-text="t.titulo"></p>
              <p class="text-xs text-ink-2" x-show="t.detalle" x-text="t.detalle"></p>
            </div>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="$store.toasts.close(t.id)" aria-label="Cerrar aviso" x-html="UI.icon('x',13)"></button>
          </div>
        </template>
      </div>`;
    document.body.appendChild(wrap);
  }
})();
