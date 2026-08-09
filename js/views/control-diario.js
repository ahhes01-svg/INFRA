/* ============================================================================
 * control-diario.js — Vista «Control diario»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/
export const state = () => {
  return {
    fProyecto: '', fSitio: '', fTecnico: '',
    editando: null, // id de la fila en edición inline

    filas(desde, hasta) {
      return Alpine.store('db').actividades
        .filter(a => a.fecha >= desde && a.fecha <= hasta)
        .filter(a => !this.fProyecto || a.proyectoId === this.fProyecto)
        .filter(a => !this.fSitio || a.sitioId === this.fSitio)
        .filter(a => !this.fTecnico || a.tecnicos.includes(this.fTecnico))
        .sort((x, y) => (y.fecha + y.hIni).localeCompare(x.fecha + x.hIni));
    },
    resumen(desde, hasta) {
      const f = this.filas(desde, hasta);
      return {
        total: f.length,
        completadas: f.filter(a => a.estado === 'completada').length,
        enCurso: f.filter(a => a.estado === 'en_ejecucion').length,
        retrasadas: f.filter(a => a.estado === 'retrasada').length,
        cumplimiento: f.length ? Math.round(f.filter(a => a.estado === 'completada').length / f.length * 100) : 0,
      };
    },
    async cambiarEstado(a, nuevo) {
      const u = Alpine.store('db').sesion.usuario;
      if (nuevo === 'en_ejecucion' && a.estado !== 'en_ejecucion') await ACCIONES.iniciarActividad(a.id, u);
      else if (nuevo === 'en_revision' && a.estado !== 'en_revision') {
        const r = await ACCIONES.finalizarActividad(a.id, u);
        if (!r.ok) { Alpine.store('toasts').push('error', 'No se puede enviar a revisión', 'Falta: ' + (r.faltantes || []).join(' · ')); return; }
      }
      // "Completada" directa es el atajo del administrador (salta la revisión)
      else if (nuevo === 'completada' && a.estado !== 'completada') await ACCIONES.completarActividad(a.id, u);
      else { a.estado = nuevo; window.dispatchEvent(new CustomEvent('app:data')); }
      Alpine.store('toasts').push('info', 'Estado actualizado', `${a.id} → ${UI.estadoInfo(nuevo).label}`);
    },
    guardar(a) {
      this.editando = null;
      Alpine.store('toasts').push('ok', 'Registro guardado', `${a.id} actualizado en el parte diario.`);
      window.dispatchEvent(new CustomEvent('app:data'));
    },
  };
}

export default {
  title: "Control diario",
  roles: ["admin", "supervisor"],
  deps: [],
  componente: "controlPage",
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="controlPage()">
  <div x-data="dateRange(window.HOY)">

    <template x-if="$store.ui.view==='loading'">
      <div class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3" x-html="UI.skel.kpis(5)"></div>
        <div x-html="UI.skel.table(8,8)"></div>
      </div>
    </template>
    <template x-if="$store.ui.view==='empty'">
      <div class="ui-card mt-8" x-html="UI.emptyState({ icon:'grid', title:'Sin partes diarios en el rango', desc:'No hay actividades registradas para los filtros elegidos. Cambia el rango de fechas o programa trabajo en la Agenda.', action: UI.btn({label:'Ir a la Agenda', icon:'calendar', attrs:\`onclick=&quot;App.ir('agenda')&quot;\`}) })"></div>
    </template>
    <template x-if="$store.ui.view==='error'">
      <div class="ui-card mt-8" x-html="UI.errorState({ desc:'El servicio de partes diarios devolvió un error inesperado (500).', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
    </template>

    <div x-show="$store.ui.view==='data'" class="space-y-4">

      <!-- Filtros: fecha / proyecto / BTS / técnico -->
      <section class="ui-card p-3 flex flex-wrap items-end gap-2" aria-label="Filtros del control diario">
        <div class="relative">
          <span class="ui-label">Rango de fechas</span>
          <button class="ui-btn ui-btn-secondary ui-btn-md" @click="open=!open" :aria-expanded="open">
            <span x-html="UI.icon('calendar',14)"></span><span x-text="label"></span><span x-html="UI.icon('chevronDown',13)"></span>
          </button>
          <div class="ui-menu shadow-e2 mt-1" x-show="open" x-cloak @click.outside="open=false" style="left:0;top:100%"
            x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
            <template x-for="p in presets" :key="p.id">
              <button class="ui-menu-item" :class="preset===p.id && 'font-semibold'" @click="aplicar(p.id)">
                <span class="w-4" x-html="preset===p.id ? UI.icon('check',14) : ''"></span><span x-text="p.label"></span>
              </button>
            </template>
            <div x-show="preset==='custom'" class="p-2 border-t border-line space-y-2">
              <input type="date" class="ui-input" x-model="desde" aria-label="Desde">
              <input type="date" class="ui-input" x-model="hasta" aria-label="Hasta">
              <button class="ui-btn ui-btn-primary ui-btn-sm w-full" @click="open=false">Aplicar</button>
            </div>
          </div>
        </div>
        <div>
          <label class="ui-label" for="cd-pry">Proyecto</label>
          <select id="cd-pry" class="ui-select" style="width:170px" x-model="fProyecto">
            <option value="">Todos</option>
            <template x-for="p in $store.db.proyectos"><option :value="p.id" x-text="p.codigo"></option></template>
          </select>
        </div>
        <div>
          <label class="ui-label" for="cd-bts">BTS</label>
          <select id="cd-bts" class="ui-select mono text-xs" style="width:190px" x-model="fSitio">
            <option value="">Todos</option>
            <template x-for="s in $store.db.sitios.slice(0,15)"><option :value="s.id" x-text="s.codigo"></option></template>
          </select>
        </div>
        <div>
          <label class="ui-label" for="cd-tec">Técnico</label>
          <select id="cd-tec" class="ui-select" style="width:190px" x-model="fTecnico">
            <option value="">Todos</option>
            <template x-for="t in $store.db.tecnicos"><option :value="t.id" x-text="t.nombre"></option></template>
          </select>
        </div>
        <button class="ui-btn ui-btn-ghost ui-btn-md" @click="fProyecto='';fSitio='';fTecnico='';aplicar('hoy')">Limpiar</button>
        <button class="ui-btn ui-btn-secondary ui-btn-md ml-auto" x-show="$store.ui.puede('exportar')" @click="UI.protoNotice()"
          x-html="UI.icon('download',14)+' Exportar a Excel'"></button>
      </section>

      <!-- Resumen del rango -->
      <section class="grid grid-cols-2 md:grid-cols-5 gap-3" aria-label="Resumen del rango">
        <div class="ui-card ui-kpi"><span class="kpi-label">Actividades</span><span class="kpi-value" x-countup="resumen(desde,hasta).total">0</span></div>
        <div class="ui-card ui-kpi"><span class="kpi-label">Completadas</span><span class="kpi-value" style="color:var(--st-completado)" x-countup="resumen(desde,hasta).completadas">0</span></div>
        <div class="ui-card ui-kpi"><span class="kpi-label">En curso</span><span class="kpi-value" style="color:var(--st-ejecucion)" x-countup="resumen(desde,hasta).enCurso">0</span></div>
        <div class="ui-card ui-kpi"><span class="kpi-label">Retrasadas</span><span class="kpi-value" style="color:var(--st-critico)" x-countup="resumen(desde,hasta).retrasadas">0</span></div>
        <div class="ui-card ui-kpi"><span class="kpi-label">Cumplimiento</span><span class="kpi-value" x-countup="resumen(desde,hasta).cumplimiento" data-suffix="%">0%</span></div>
      </section>

      <!-- Tabla editable -->
      <section aria-label="Parte diario editable">
        <p class="text-xs text-ink-3 mb-2">Edición en línea: cambia el estado desde la propia fila, o pulsa <span class="font-medium text-ink-2">Editar</span> para corregir horas reales y observaciones.</p>
        <div class="ui-table-wrap">
          <table class="ui-table" aria-label="Parte diario">
            <thead><tr>
              <th class="col-sticky">ID</th><th>Fecha</th><th>Actividad</th><th>Sitio</th><th>Cuadrilla</th>
              <th>Plan</th><th>Real</th><th>Estado (editable)</th><th>Avance</th><th>Observaciones</th><th><span class="sr-only">Acciones</span></th>
            </tr></thead>
            <tbody>
              <template x-for="a in filas(desde,hasta)" :key="a.id">
                <tr>
                  <td class="col-sticky mono text-xs" x-text="a.id"></td>
                  <td class="mono text-xs" x-text="UI.fmt.fechaCorta(a.fecha)"></td>
                  <td class="max-w-[180px] truncate" :title="CALC.tipo(a.tipoId).nombre" x-text="CALC.tipo(a.tipoId).nombre"></td>
                  <td class="mono text-xs" x-text="CALC.sitio(a.sitioId).codigo"></td>
                  <td><span class="ui-avatar-stack" x-html="a.tecnicos.map(t=>UI.avatar(CALC.tecnico(t),24)).join('')"></span></td>
                  <td class="mono text-xs whitespace-nowrap" x-text="a.hIni+'–'+a.hFin"></td>
                  <td class="mono text-xs whitespace-nowrap">
                    <template x-if="editando===a.id">
                      <span class="flex gap-1">
                        <input type="time" class="ui-input !h-7 !px-1" style="width:76px" x-model="a.inicioReal" aria-label="Inicio real">
                        <input type="time" class="ui-input !h-7 !px-1" style="width:76px" x-model="a.finReal" aria-label="Fin real">
                      </span>
                    </template>
                    <template x-if="editando!==a.id">
                      <span x-text="(a.inicioReal||'—') + '–' + (a.finReal||'—')"></span>
                    </template>
                  </td>
                  <td>
                    <select class="ui-select !h-7 text-xs" style="width:132px" :value="a.estado"
                      @change="cambiarEstado(a, $event.target.value)" :disabled="!$store.ui.puede('editar')"
                      :aria-label="'Estado de '+a.id">
                      <option value="pendiente">Pendiente</option><option value="en_ejecucion">En ejecución</option>
                      <option value="en_revision">En revisión</option><option value="completada">Completada</option>
                      <option value="retrasada">Retrasada</option><option value="cancelada">Cancelada</option>
                    </select>
                  </td>
                  <td x-html="UI.progress(CALC.avanceActividad(a), {estado: a.estado==='retrasada' ? 'critico':''})"></td>
                  <td class="max-w-[220px]">
                    <template x-if="editando===a.id">
                      <input class="ui-input !h-7 text-xs" x-model="a.obs" aria-label="Observaciones">
                    </template>
                    <template x-if="editando!==a.id">
                      <p class="text-xs text-ink-2 truncate" :title="a.obs" x-text="a.obs || '—'"></p>
                    </template>
                  </td>
                  <td class="row-actions text-right whitespace-nowrap">
                    <button class="ui-btn ui-btn-secondary ui-btn-sm" x-show="editando!==a.id && $store.ui.puede('editar')" @click="editando=a.id" x-html="UI.icon('edit',12)+' Editar'"></button>
                    <button class="ui-btn ui-btn-primary ui-btn-sm" x-show="editando===a.id" @click="guardar(a)" x-html="UI.icon('check',12)+' Guardar'"></button>
                  </td>
                </tr>
              </template>
              <tr x-show="!filas(desde,hasta).length">
                <td colspan="11" x-html="UI.emptyState({icon:'grid', title:'Sin registros en el rango', desc:'Prueba con otro rango de fechas u otros filtros.'})"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</div>`,
};
