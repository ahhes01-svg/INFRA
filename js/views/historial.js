/* ============================================================================
 * historial.js — Vista «Historial»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/
export const state = () => {
  return {
    q: '', fAccion: '',
    acciones: [
      ['actividad_iniciada', 'Actividad iniciada', 'play', 'ejecucion'],
      ['actividad_finalizada', 'Cierre enviado a revisión', 'clock', 'pendiente'],
      ['actividad_aprobada', 'Cierre aprobado', 'checkCircle', 'completado'],
      ['actividad_rechazada', 'Cierre rechazado', 'x', 'critico'],
      ['actividad_completada', 'Actividad completada', 'checkCircle', 'completado'],
      ['material_despachado', 'Material despachado', 'box', 'ejecucion'],
      ['material_ingresado', 'Ingreso a almacén', 'box', 'completado'],
      ['actividad_creada', 'Actividad programada', 'plus', 'ejecucion'],
      ['actividad_reprogramada', 'Reprogramación', 'calendar', 'pendiente'],
      ['actividad_retrasada', 'Retraso registrado', 'clock', 'critico'],
      ['actividad_cancelada', 'Actividad cancelada', 'x', 'cancelado'],
      ['incidencia_creada', 'Incidencia reportada', 'alert', 'critico'],
      ['incidencia_actualizada', 'Incidencia actualizada', 'refresh', 'pendiente'],
      ['incidencia_resuelta', 'Incidencia resuelta', 'checkCircle', 'completado'],
      ['evidencia_subida', 'Evidencia subida', 'camera', 'ejecucion'],
      ['evidencia_aprobada', 'Evidencia aprobada', 'checkCircle', 'completado'],
      ['checklist', 'Checklist', 'clipboard', 'ejecucion'],
      ['proyecto_actualizado', 'Proyecto actualizado', 'folder', 'pendiente'],
    ],
    meta(accion) { return this.acciones.find(a => a[0] === accion) || ['', accion, 'info', 'cancelado']; },
    lista() {
      return Alpine.store('db').historial
        .filter(h => !this.fAccion || h.accion === this.fAccion)
        .filter(h => !this.q || (h.usuario + h.entidad + h.detalle).toLowerCase().includes(this.q.toLowerCase()));
    },
    grupos() {
      const g = {};
      this.lista().forEach(h => { (g[h.fecha] = g[h.fecha] || []).push(h); });
      return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
    },
  };
}

export default {
  title: "Historial",
  roles: ["admin", "supervisor"],
  deps: [],
  componente: "historialPage",
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="historialPage()">

  <template x-if="$store.ui.view==='loading'">
    <div class="max-w-3xl space-y-3">
      <template x-for="i in 7">
        <div class="flex gap-3" aria-hidden="true">
          <div class="ui-skel" style="width:26px;height:26px;border-radius:999px"></div>
          <div class="flex-1 space-y-2 pb-4"><div class="ui-skel" style="width:35%;height:10px"></div><div class="ui-skel" style="width:75%;height:12px"></div></div>
        </div>
      </template>
    </div>
  </template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8 max-w-3xl" x-html="UI.emptyState({ icon:'history', title:'Historial vacío', desc:'Cada acción sobre actividades, incidencias y evidencias queda registrada aquí con fecha, hora y usuario.' })"></div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8 max-w-3xl" x-html="UI.errorState({ desc:'No se pudo recuperar la bitácora de operaciones.', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>

  <div x-show="$store.ui.view==='data'" class="max-w-3xl space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" x-html="UI.icon('search',14)"></span>
        <input type="search" class="ui-input pl-8" style="width:240px" placeholder="Usuario, entidad, detalle…" x-model="q" aria-label="Buscar en historial">
      </div>
      <select class="ui-select" style="width:210px" x-model="fAccion" aria-label="Tipo de evento">
        <option value="">Todos los eventos</option>
        <template x-for="a in acciones" :key="a[0]"><option :value="a[0]" x-text="a[1]"></option></template>
      </select>
      <p class="text-xs text-ink-3 ml-auto mono" x-text="lista().length + ' registros'"></p>
    </div>

    <template x-for="[fecha, items] in grupos()" :key="fecha">
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2 sticky top-0 bg-surface-0 py-1"
          x-text="UI.fmt.diaLargo(fecha)"></h2>
        <div class="ui-card divide-y divide-[var(--line)]">
          <template x-for="h in items" :key="h.id">
            <div class="flex gap-3 p-3.5">
              <span class="w-7 h-7 rounded-full flex items-center justify-center flex-none border"
                :style="\`color:var(--st-\${meta(h.accion)[3]});background:var(--st-\${meta(h.accion)[3]}-bg);border-color:var(--st-\${meta(h.accion)[3]}-bd)\`"
                x-html="UI.icon(meta(h.accion)[2], 13)"></span>
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-sm font-medium" x-text="meta(h.accion)[1]"></span>
                  <span class="mono text-xs text-ink-3" x-text="h.entidad"></span>
                  <span class="mono text-xs text-ink-3 ml-auto" x-text="h.hora"></span>
                </div>
                <p class="text-sm text-ink-2 mt-0.5" x-text="h.detalle"></p>
                <p class="text-xs text-ink-3 mt-0.5" x-text="'por ' + h.usuario"></p>
              </div>
            </div>
          </template>
        </div>
      </section>
    </template>
    <div class="ui-card" x-show="!lista().length"
      x-html="UI.emptyState({icon:'search', title:'Sin coincidencias', desc:'Ningún registro coincide con la búsqueda o el filtro.'})"></div>
  </div>
</div>`,
};
