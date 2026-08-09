(function () {
/* ============================================================================
 * configuracion.js — Vista «Configuración»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/


window.NettOps.registrarVista('configuracion', {
  title: "Configuración",
  roles: ["admin"],
  deps: [],
  componente: null,
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="{ tab: 'general' }">

  <template x-if="$store.ui.view==='loading'">
    <div class="max-w-4xl grid md:grid-cols-2 gap-4" x-html="UI.skel.cards(4)"></div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8 max-w-4xl" x-html="UI.errorState({ desc:'No se pudo cargar la configuración de la cuenta.', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8 max-w-4xl" x-html="UI.emptyState({ icon:'settings', title:'Sin parámetros personalizados', desc:'Esta cuenta usa la configuración por defecto del sistema.' })"></div>
  </template>

  <div x-show="$store.ui.view==='data'" class="max-w-4xl space-y-4">

    <div class="ui-tabs" role="tablist">
      <template x-for="t in [['general','General'],['catalogos','Catálogos'],['umbrales','Umbrales y alertas'],['apariencia','Apariencia']]" :key="t[0]">
        <button class="ui-tab" :class="tab===t[0] && 'is-active'" role="tab" :aria-selected="tab===t[0]" @click="tab=t[0]" x-text="t[1]"></button>
      </template>
    </div>

    <!-- General -->
    <section x-show="tab==='general'" role="tabpanel" class="grid md:grid-cols-2 gap-4">
      <div class="ui-card p-5 space-y-4">
        <h2 class="text-sm font-semibold">Datos de la empresa</h2>
        <div><label class="ui-label" for="cf-rz">Razón social</label><input id="cf-rz" class="ui-input" value="NettOps Perú S.A.C."></div>
        <div><label class="ui-label" for="cf-ruc">RUC</label><input id="cf-ruc" class="ui-input mono" value="20601234567"></div>
        <div><label class="ui-label" for="cf-dir">Sede principal</label><input id="cf-dir" class="ui-input" value="Av. San Martín 1550, Ica"></div>
        <div>
          <label class="ui-label" for="cf-tz">Zona horaria</label>
          <select id="cf-tz" class="ui-select"><option>América/Lima (UTC−05:00)</option></select>
        </div>
        <button class="ui-btn ui-btn-primary ui-btn-md" @click="$store.toasts.push('ok','Configuración guardada','Los cambios viven solo en memoria del prototipo.')">Guardar cambios</button>
      </div>
      <div class="ui-card p-5 space-y-4">
        <h2 class="text-sm font-semibold">Cuenta y sesión</h2>
        <div class="flex items-center gap-3">
          <span x-html="UI.avatar({nombre: $store.db.sesion.usuario}, 40)"></span>
          <div>
            <p class="font-medium" x-text="$store.db.sesion.usuario"></p>
            <p class="text-xs text-ink-3" x-text="$store.db.sesion.cargo + ' · rol actual: ' + $store.ui.rolLabel()"></p>
          </div>
        </div>
        <p class="text-sm text-ink-2">El selector de rol del navbar cambia los módulos y acciones visibles: Administrador ve todo, Supervisor gestiona la operación y el Técnico solo su trabajo de campo.</p>
        <div class="border-t border-line pt-4 space-y-2">
          <button class="ui-btn ui-btn-secondary ui-btn-md w-full" @click="UI.protoNotice()" x-html="UI.icon('user',14)+' Gestionar usuarios y permisos'"></button>
          <button class="ui-btn ui-btn-ghost ui-btn-md w-full" @click="$store.ui.cerrarSesion()" x-html="UI.icon('logout',14)+' Cerrar sesión'"></button>
        </div>
      </div>
    </section>

    <!-- Catálogos -->
    <section x-show="tab==='catalogos'" x-cloak role="tabpanel" class="space-y-4">
      <div class="ui-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold">Tipos de actividad (<span x-text="$store.db.tiposActividad.length"></span>)</h2>
          <button class="ui-btn ui-btn-secondary ui-btn-sm" @click="UI.protoNotice()" x-html="UI.icon('plus',12)+' Añadir tipo'"></button>
        </div>
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th class="text-right">Duración estándar</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              <template x-for="t in $store.db.tiposActividad" :key="t.id">
                <tr>
                  <td class="mono text-xs" x-text="t.id"></td>
                  <td x-text="t.nombre"></td>
                  <td class="text-xs" x-text="t.categoria"></td>
                  <td class="mono text-xs text-right" x-text="t.durHoras + ' h'"></td>
                  <td class="row-actions text-right">
                    <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="UI.protoNotice()" aria-label="Editar" x-html="UI.icon('edit',13)"></button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div class="ui-card p-5">
        <h2 class="text-sm font-semibold mb-3">Clientes (<span x-text="$store.db.clientes.length"></span>)</h2>
        <div class="grid md:grid-cols-3 gap-3">
          <template x-for="c in $store.db.clientes" :key="c.id">
            <div class="border border-line rounded-md p-3">
              <p class="font-medium" x-text="c.nombre"></p>
              <p class="text-xs text-ink-3" x-text="c.razon"></p>
              <p class="mono text-xs text-ink-2 mt-1" x-text="'RUC ' + c.ruc"></p>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Umbrales -->
    <section x-show="tab==='umbrales'" x-cloak role="tabpanel" class="grid md:grid-cols-2 gap-4">
      <div class="ui-card p-5 space-y-4">
        <h2 class="text-sm font-semibold">Alertas de operación</h2>
        <div>
          <label class="ui-label" for="cf-u1">Marcar actividad como retrasada tras (min)</label>
          <input id="cf-u1" type="number" class="ui-input mono" value="30">
          <p class="ui-help">Minutos de tolerancia sobre la hora de inicio planificada.</p>
        </div>
        <div>
          <label class="ui-label" for="cf-u2">Plazo por defecto de incidencia crítica (horas)</label>
          <input id="cf-u2" type="number" class="ui-input mono" value="48">
        </div>
        <div>
          <label class="ui-label" for="cf-u3">Evidencias mínimas por actividad completada</label>
          <input id="cf-u3" type="number" class="ui-input mono" value="2">
          <p class="ui-help">Foto de antes y después como mínimo.</p>
        </div>
        <button class="ui-btn ui-btn-primary ui-btn-md" @click="$store.toasts.push('ok','Umbrales actualizados')">Guardar umbrales</button>
      </div>
      <div class="ui-card p-5 space-y-3">
        <h2 class="text-sm font-semibold">Notificaciones</h2>
        <template x-for="(opt, i) in ['Incidencia crítica nueva o vencida','Actividad retrasada','Evidencia pendiente de revisión','Material bajo stock mínimo','Resumen diario a las 18:00']" :key="i">
          <label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
            <span class="text-sm" x-text="opt"></span>
            <input type="checkbox" class="ui-check" :checked="i < 4">
          </label>
        </template>
      </div>
    </section>

    <!-- Apariencia -->
    <section x-show="tab==='apariencia'" x-cloak role="tabpanel" class="ui-card p-5 space-y-4 md:max-w-lg">
      <h2 class="text-sm font-semibold">Apariencia</h2>
      <div class="flex gap-3">
        <button class="flex-1 border rounded-md p-3 text-left tr-150" :class="$store.ui.theme==='light' ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line hover:border-line-strong'"
          @click="$store.ui.setTheme('light')" :aria-pressed="$store.ui.theme==='light'">
          <span class="flex items-center gap-2 font-medium text-sm" x-html="UI.icon('sun',15)+' Modo claro'"></span>
          <span class="text-xs text-ink-3 block mt-1">Oficina y exteriores</span>
        </button>
        <button class="flex-1 border rounded-md p-3 text-left tr-150" :class="$store.ui.theme==='dark' ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line hover:border-line-strong'"
          @click="$store.ui.setTheme('dark')" :aria-pressed="$store.ui.theme==='dark'">
          <span class="flex items-center gap-2 font-medium text-sm" x-html="UI.icon('moon',15)+' Modo oscuro'"></span>
          <span class="text-xs text-ink-3 block mt-1">Uso nocturno en campo, sin negros puros</span>
        </button>
      </div>
      <a href="design-system.html" class="ui-btn ui-btn-secondary ui-btn-md w-full" x-html="UI.icon('grid',14)+' Abrir el sistema de diseño'"></a>
    </section>
  </div>
</div>`,
});
})();
