(function () {
/* ============================================================================
 * shell.js — Marco de la aplicación · NettOps Perú
 *
 * Sidebar, barra superior, campana y avisos. Se construye UNA sola vez al
 * arrancar: al cambiar de sección solo se reemplaza el contenido interior, así
 * que el menú no parpadea ni se vuelve a calcular.
 *
 * No usa utilidades de Tailwind: todo su estilo vive en las clases .shell-*
 * definidas aquí, para que el marco siga en pie aunque la hoja de estilos
 * externa tarde o falle.
 * ==========================================================================*/

const NAV = [
  { id: 'mi-jornada', label: 'Mi jornada', icon: 'smartphone', roles: ['tecnico'] },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'supervisor'] },
  { id: 'supervision', label: 'Supervisión', icon: 'shield', roles: ['supervisor'] },
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

const PERMISOS = {
  admin: ['crear', 'editar', 'eliminar', 'aprobar', 'asignar', 'exportar', 'configurar', 'campo'],
  supervisor: ['crear', 'editar', 'aprobar', 'asignar', 'exportar', 'campo'],
  tecnico: ['campo'],
};

/* ── CSS propio del marco ─────────────────────────────────────────────────*/
function inyectarCss() {
  if (document.getElementById('shell-css')) return;
  const css = `
  .shell{ display:flex; height:100vh; height:100dvh; overflow:hidden; }
  .shell-side{ display:flex; flex-direction:column; width:224px; flex:none;
    background:var(--s1); border-right:1px solid var(--line); position:relative; z-index:20; }
  .shell-scrim{ display:none; }
  .shell-burger{ display:none; }
  @media (max-width:1023px){
    .shell-side{ display:none; }
    .shell-side.is-open{ display:flex; position:fixed; top:0; bottom:0; left:0; z-index:50; box-shadow:0 12px 32px rgba(2,6,23,.22); }
    .shell-scrim.is-open{ display:block; position:fixed; inset:0; background:rgba(15,23,42,.45); z-index:40; }
    .shell-burger{ display:inline-flex; }
  }
  .shell-brand{ height:56px; display:flex; align-items:center; gap:10px; padding:0 16px;
    border-bottom:1px solid var(--line); flex:none; text-decoration:none; color:inherit; }
  .shell-brand .b-name{ font-size:14px; font-weight:700; letter-spacing:-.01em; line-height:1; }
  .shell-brand .b-sub{ font-size:11px; color:var(--ink3); font-family:'JetBrains Mono',monospace; margin-top:3px; line-height:1; }
  .shell-brand .b-close{ margin-left:auto; display:none; }
  @media (max-width:1023px){ .shell-brand .b-close{ display:inline-flex; } }
  .shell-nav{ flex:1; overflow-y:auto; padding:12px 8px; display:flex; flex-direction:column; gap:2px; }
  .shell-nav a{ display:flex; align-items:center; gap:10px; padding:0 12px; height:36px; flex:none;
    border-radius:6px; font-size:13px; font-weight:500; color:var(--ink2); text-decoration:none;
    transition:background .15s ease-out, color .15s ease-out; }
  .shell-nav a:hover{ background:var(--s2); color:var(--ink1); }
  .shell-nav a.is-active{ background:#eff6ff; color:#1d4ed8; }
  .dark .shell-nav a.is-active{ background:rgba(96,165,250,.14); color:#60a5fa; }
  .shell-nav a .nav-badge{ margin-left:auto; height:17px; padding:0 6px; }
  .shell-foot{ padding:12px 16px; border-top:1px solid var(--line); flex:none; }
  .shell-foot a{ display:flex; align-items:center; gap:8px; font-size:11px; color:var(--ink3);
    text-decoration:none; transition:color .15s ease-out; }
  .shell-foot a:hover{ color:var(--ink1); }
  .shell-foot .f-ver{ font-size:11px; color:var(--ink3); font-family:'JetBrains Mono',monospace; margin-top:8px; }

  .shell-main{ flex:1; display:flex; flex-direction:column; min-width:0; }
  .shell-top{ height:56px; flex:none; background:var(--s1); border-bottom:1px solid var(--line);
    display:flex; align-items:center; gap:8px; padding:0 16px; position:relative; z-index:20; }
  .shell-top .t-title{ font-size:18px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .shell-top .t-right{ margin-left:auto; display:flex; align-items:center; gap:6px; }
  .shell-top select.ui-select{ width:auto; height:32px; font-size:13px; padding-right:26px; }

  .seg{ display:flex; align-items:center; gap:1px; border:1px solid var(--line); border-radius:6px;
    padding:2px; background:var(--s2); }
  .seg button{ padding:0 9px; height:24px; border-radius:4px; font-size:11px; font-weight:500;
    color:var(--ink3); background:none; border:none; cursor:pointer; white-space:nowrap;
    transition:background .15s ease-out, color .15s ease-out; }
  .seg button:hover{ color:var(--ink1); }
  .seg button.is-on{ background:var(--s1); color:var(--ink1); box-shadow:0 1px 2px rgba(2,6,23,.06); }
  @media (max-width:899px){ .shell-top .seg{ display:none; } }

  .bell-wrap{ position:relative; }
  .bell-dot{ position:absolute; top:-2px; right:-2px; min-width:15px; height:15px; padding:0 3px;
    border-radius:999px; font-size:9px; font-weight:700; display:flex; align-items:center;
    justify-content:center; color:#fff; background:var(--st-critico); }
  .dark .bell-dot{ color:#0f172a; }
  .bell-menu{ position:absolute; right:0; top:calc(100% + 6px); width:min(340px, calc(100vw - 24px));
    background:var(--s1); border:1px solid var(--line); border-radius:8px;
    box-shadow:0 4px 12px rgba(2,6,23,.10); z-index:60; overflow:hidden; }
  .bell-head{ display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--line); }
  .bell-head .bh-t{ font-size:13px; font-weight:600; }
  .bell-head button{ font-size:11px; color:#2563eb; background:none; border:none; cursor:pointer; }
  .dark .bell-head button{ color:#60a5fa; }
  .bell-list{ max-height:320px; overflow-y:auto; }
  .notif-row{ display:flex; gap:10px; padding:10px 12px; border-bottom:1px solid var(--line);
    text-decoration:none; color:inherit; transition:background .15s ease-out; }
  .notif-row:hover{ background:var(--s2); }
  .notif-row.unread{ background:var(--s2); }
  .notif-row .n-t{ font-size:13px; font-weight:500; color:var(--ink1); display:block;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .notif-row .n-d{ font-size:11px; color:var(--ink2); display:block; }
  .notif-row .n-f{ font-size:11px; color:var(--ink3); font-family:'JetBrains Mono',monospace; }
  .notif-row .n-dot{ width:6px; height:6px; border-radius:999px; margin-top:6px; flex:none; }
  .notif-row.unread .n-dot{ background:var(--st-ejecucion); }
  .bell-all{ display:block; text-align:center; font-size:13px; color:#2563eb; padding:8px; text-decoration:none; }
  .bell-all:hover{ text-decoration:underline; }
  .dark .bell-all{ color:#60a5fa; }

  .user-chip{ display:flex; align-items:center; padding-left:10px; border-left:1px solid var(--line); position:relative; }
  .user-btn{ display:flex; align-items:center; gap:8px; background:none; border:none; cursor:pointer;
    padding:4px 6px; border-radius:6px; color:inherit; transition:background .15s ease-out; }
  .user-btn:hover{ background:var(--s2); }
  .user-chip .u-meta{ line-height:1.2; text-align:left; }
  .user-chip .u-n{ font-size:13px; font-weight:500; white-space:nowrap; display:block; }
  .user-chip .u-r{ font-size:11px; color:var(--ink3); display:block; }
  @media (max-width:1279px){ .user-chip .u-meta{ display:none; } }

  #main-slot{ flex:1; overflow-y:auto; }
  #vista{ display:block; padding:16px; max-width:1400px; margin:0 auto; width:100%;
    animation:pageIn .2s ease-out; }
  @media (min-width:1024px){ #vista{ padding:24px; } }
  @keyframes pageIn{ from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:none; } }

  /* Marco móvil (Mi jornada) */
  body.movil .shell-side, body.movil .shell-top{ display:none; }
  body.movil #vista{ padding:16px 16px 40px; max-width:520px; }
  .mobile-top{ position:sticky; top:0; z-index:40; background:var(--s1); border-bottom:1px solid var(--line);
    height:56px; display:none; align-items:center; gap:10px; padding:0 16px; }
  body.movil .mobile-top{ display:flex; }
  .mobile-top .m-t{ font-size:14px; font-weight:700; line-height:1; }
  .mobile-top .m-s{ font-size:11px; color:var(--ink3); font-family:'JetBrains Mono',monospace; margin-top:3px; line-height:1; }
  .mobile-top .m-right{ margin-left:auto; display:flex; align-items:center; gap:6px; }
  .mobile-top select.ui-select{ width:auto; height:36px; font-size:13px; padding-right:26px; }
  `;
  const el = document.createElement('style');
  el.id = 'shell-css';
  el.textContent = css;
  document.head.appendChild(el);
}

/* ── Marcado del marco ────────────────────────────────────────────────────*/
function html() {
  const UI = window.UI;
  return `
  <div class="shell" x-data="{}">
    <aside class="shell-side" :class="$store.ui.sidebarOpen && 'is-open'" aria-label="Navegación principal">
      <a class="shell-brand" href="#/dashboard">
        <span style="color:#2563eb">${UI.icon('tower', 22)}</span>
        <span>
          <span class="b-name" style="display:block">NettOps</span>
          <span class="b-sub" style="display:block">Operaciones · Perú</span>
        </span>
        <button class="ui-btn ui-btn-ghost ui-btn-sm b-close" @click.prevent="$store.ui.sidebarOpen=false" aria-label="Cerrar menú">${UI.icon('x', 15)}</button>
      </a>
      <nav class="shell-nav">
        <template x-for="item in $store.ui.nav()" :key="item.id">
          <a :href="'#/' + item.id" :class="$store.ui.pagina === item.id && 'is-active'"
            @click="$store.ui.sidebarOpen=false"
            :aria-current="$store.ui.pagina === item.id ? 'page' : false">
            <span x-html="UI.icon(item.icon, 16)"></span>
            <span x-text="item.label"></span>
            <template x-if="item.id === 'incidencias' && CALC.kpis().incidenciasAbiertas">
              <span class="ui-badge st-critico nav-badge" x-text="CALC.kpis().incidenciasAbiertas"></span>
            </template>
            <template x-if="item.id === 'notificaciones' && CALC.kpis().noLeidas">
              <span class="ui-badge st-ejecucion nav-badge" x-text="CALC.kpis().noLeidas"></span>
            </template>
          </a>
        </template>
      </nav>
      <div class="shell-foot">
        <a href="pages/design-system.html">${UI.icon('grid', 13)} Sistema de diseño</a>
        <p class="f-ver">NettOps v2.0 · ${window.HOY}</p>
      </div>
    </aside>
    <div class="shell-scrim" :class="$store.ui.sidebarOpen && 'is-open'" @click="$store.ui.sidebarOpen=false" aria-hidden="true"></div>

    <div class="shell-main">
      <header class="shell-top">
        <button class="ui-btn ui-btn-ghost ui-btn-sm shell-burger" @click="$store.ui.sidebarOpen=true" aria-label="Abrir menú">${UI.icon('menu', 17)}</button>
        <h1 class="t-title" x-text="$store.ui.titulo"></h1>

        <div class="t-right">
          <button class="ck-trigger" @click="window.dispatchEvent(new CustomEvent('app:cmdk'))" aria-label="Búsqueda global">
            ${UI.icon('search', 14)}<span class="ck-lbl">Buscar…</span><span class="ck-kbd">Ctrl K</span>
          </button>

          <div class="seg" role="group" aria-label="Simular estado de pantalla" x-tooltip="'Demo: simula los 4 estados de la pantalla'">
            ${['data|Datos', 'loading|Carga', 'empty|Vacío', 'error|Error'].map(o => {
              const [v, l] = o.split('|');
              return `<button :class="$store.ui.view==='${v}' && 'is-on'" @click="$store.ui.setView('${v}')" :aria-pressed="$store.ui.view==='${v}'">${l}</button>`;
            }).join('')}
          </div>

          <template x-if="$store.ui.demo">
            <span class="ui-badge st-pendiente" x-tooltip="'Los cambios viven solo en memoria: no hay servidor conectado'">
              <span class="dot" aria-hidden="true"></span>Modo demo
            </span>
          </template>

          <template x-if="$store.ui.demo">
            <span>
              <label class="sr-only" for="rol-sel">Rol</label>
              <select id="rol-sel" class="ui-select" :value="$store.ui.role" @change="$store.ui.setRole($event.target.value)">
                <option value="admin">Administrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="tecnico">Técnico</option>
              </select>
            </span>
          </template>

          <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="$store.ui.setTheme($store.ui.theme==='dark'?'light':'dark')"
            :aria-label="$store.ui.theme==='dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            <span x-html="$store.ui.theme==='dark' ? UI.icon('sun',15) : UI.icon('moon',15)"></span>
          </button>

          <div class="bell-wrap">
            <button class="ui-btn ui-btn-ghost ui-btn-sm" style="position:relative" @click="$store.ui.bellOpen=!$store.ui.bellOpen"
              :aria-expanded="$store.ui.bellOpen" aria-label="Notificaciones">
              ${UI.icon('bell', 16)}
              <template x-if="CALC.kpis().noLeidas"><span class="bell-dot" x-text="CALC.kpis().noLeidas"></span></template>
            </button>
            <div class="bell-menu" x-show="$store.ui.bellOpen" x-cloak @click.outside="$store.ui.bellOpen=false"
              @keydown.escape.window="$store.ui.bellOpen=false"
              x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
              <div class="bell-head">
                <p class="bh-t">Notificaciones</p>
                <button @click="ACCIONES.marcarTodasLeidas()">Marcar todas leídas</button>
              </div>
              <div class="bell-list">
                <template x-for="n in $store.db.notificaciones.slice(0,6)" :key="n.id">
                  <a :href="'#/' + n.link.replace('.html','')" class="notif-row" :class="!n.leida && 'unread'"
                    @click="ACCIONES.marcarLeida(n.id); $store.ui.bellOpen=false">
                    <span :style="'color:var(--st-'+(n.tipo==='completado'?'completado':n.tipo==='critico'?'critico':n.tipo==='ejecucion'?'ejecucion':'pendiente')+')'"
                      x-html="UI.icon(n.tipo==='critico'?'alertCircle':n.tipo==='completado'?'checkCircle':n.tipo==='ejecucion'?'zap':'info', 16)"></span>
                    <span style="flex:1;min-width:0">
                      <span class="n-t" x-text="n.titulo"></span>
                      <span class="n-d" x-text="n.detalle"></span>
                      <span class="n-f" x-text="n.fecha+' '+n.hora"></span>
                    </span>
                    <span class="n-dot" aria-hidden="true"></span>
                  </a>
                </template>
              </div>
              <a href="#/notificaciones" class="bell-all" @click="$store.ui.bellOpen=false">Ver todas</a>
            </div>
          </div>

          <div class="user-chip" x-data="{ menu: false }">
            <button class="user-btn" @click="menu = !menu" :aria-expanded="menu" aria-label="Menú de usuario">
              <span x-html="UI.avatar({ nombre: $store.db.sesion.usuario }, 32)"></span>
              <span class="u-meta">
                <span class="u-n" x-text="$store.db.sesion.usuario"></span>
                <span class="u-r" x-text="$store.ui.rolLabel()"></span>
              </span>
            </button>
            <div class="ui-menu shadow-e2" style="right:0;top:calc(100% + 6px);left:auto" x-show="menu" x-cloak
              @click.outside="menu = false" @keydown.escape.window="menu = false"
              x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start" role="menu">
              <div style="padding:8px 10px;border-bottom:1px solid var(--line)">
                <p style="font-size:13px;font-weight:600" x-text="$store.db.sesion.usuario"></p>
                <p style="font-size:11px;color:var(--ink3)" x-text="$store.db.sesion.cargo"></p>
              </div>
              <a href="#/configuracion" class="ui-menu-item" role="menuitem" @click="menu=false">${UI.icon('settings', 14)} Configuración</a>
              <button class="ui-menu-item is-danger" role="menuitem" @click="$store.ui.cerrarSesion()">${UI.icon('logout', 14)} Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>

      <header class="mobile-top" x-show="$store.ui.pagina==='mi-jornada'">
        <span style="color:#2563eb">${UI.icon('tower', 20)}</span>
        <div>
          <p class="m-t">Mi jornada</p>
          <p class="m-s">${window.HOY}</p>
        </div>
        <div class="m-right">
          <template x-if="$store.ui.demo">
            <select class="ui-select" aria-label="Rol" :value="$store.ui.role" @change="$store.ui.setRole($event.target.value)">
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="tecnico">Técnico</option>
            </select>
          </template>
          <button class="ui-btn ui-btn-ghost ui-btn-md" style="min-width:44px" @click="$store.ui.setTheme($store.ui.theme==='dark'?'light':'dark')"
            :aria-label="$store.ui.theme==='dark' ? 'Modo claro' : 'Modo oscuro'">
            <span x-html="$store.ui.theme==='dark' ? UI.icon('sun',17) : UI.icon('moon',17)"></span>
          </button>
        </div>
      </header>

      <div id="main-slot"><main id="vista"></main></div>
    </div>
  </div>

  <div x-data="cmdk()">
    <template x-if="open">
      <div @keydown.escape.window="hide()">
        <div class="ui-backdrop" @click="hide()"></div>
        <div class="ck-modal" role="dialog" aria-modal="true" aria-label="Búsqueda global">
          <div class="ck-box" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start" @click.outside="hide()">
            <div class="ck-input-row">
              ${UI.icon('search', 16)}
              <input x-ref="inp" type="text" x-model="q" @input="idx=0"
                placeholder="Sitio, actividad, técnico, proyecto, incidencia, material…"
                @keydown.arrow-down.prevent="mover(1)" @keydown.arrow-up.prevent="mover(-1)"
                @keydown.enter.prevent="ir()" aria-label="Buscar en todo el sistema">
              <span class="ck-kbd">esc</span>
            </div>
            <div class="ck-list">
              <template x-for="g in grupos" :key="g.nombre">
                <div>
                  <p class="ck-group" x-text="g.nombre"></p>
                  <template x-for="item in g.items" :key="item.href + item.t">
                    <a :href="item.href" class="ck-item" :class="idxDe(item)===idx && 'is-active'"
                      @click="hide()" @mouseenter="idx = idxDe(item)">
                      <span class="ck-ico" x-html="UI.icon(item.icon, 15)"></span>
                      <span style="min-width:0">
                        <span class="ck-t" style="display:block" x-text="item.t"></span>
                        <span class="ck-s" style="display:block" x-text="item.s"></span>
                      </span>
                      <span class="ck-right" x-html="item.badge ? UI.badge(item.badge) : ''"></span>
                    </a>
                  </template>
                </div>
              </template>
              <div class="ck-empty" x-show="q.trim() && !planos.length">
                Sin resultados para «<span x-text="q"></span>». Prueba con un código de sitio (IC-…), un ID (ACT-…) o un nombre.
              </div>
            </div>
            <div class="ck-foot">
              <span><span class="ck-kbd">↑↓</span> navegar</span>
              <span><span class="ck-kbd">↵</span> abrir</span>
              <span><span class="ck-kbd">esc</span> cerrar</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <div x-data="{}">
    <div class="ui-toasts" aria-live="polite">
      <template x-for="t in $store.toasts.list" :key="t.id">
        <div class="ui-toast" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start" role="status">
          <span class="t-bar" :style="'background:var(--st-'+({ok:'completado',error:'critico',warn:'pendiente',info:'ejecucion'})[t.tipo]+')'"></span>
          <span :style="'color:var(--st-'+({ok:'completado',error:'critico',warn:'pendiente',info:'ejecucion'})[t.tipo]+')'"
            x-html="UI.icon(({ok:'checkCircle',error:'alertCircle',warn:'alert',info:'info'})[t.tipo], 16)"></span>
          <div style="flex:1;min-width:0">
            <p style="font-size:13px;font-weight:600" x-text="t.titulo"></p>
            <p style="font-size:11px;color:var(--ink2)" x-show="t.detalle" x-text="t.detalle"></p>
          </div>
          <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="$store.toasts.close(t.id)" aria-label="Cerrar aviso" x-html="UI.icon('x',13)"></button>
        </div>
      </template>
    </div>
  </div>`;
}

NettOps.shell = { NAV, ROLES, PERMISOS, inyectarCss, html };
})();
