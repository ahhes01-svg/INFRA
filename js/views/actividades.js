/* ============================================================================
 * actividades.js — Vista «Actividades»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/
export const state = () => {
  const abrir = App.param('id');
  return {
    sel: null,
    vista: 'tabla',            // tabla | kanban
    rechazando: false,
    motivoRechazo: '',
    dragId: null,
    colSobre: null,            // columna bajo el cursor al arrastrar
    columnas: [
      { id: 'pendiente', label: 'Pendiente', estados: ['pendiente', 'retrasada'] },
      { id: 'en_ejecucion', label: 'En ejecución', estados: ['en_ejecucion'] },
      { id: 'en_revision', label: 'En revisión', estados: ['en_revision'] },
      { id: 'completada', label: 'Completada', estados: ['completada'] },
    ],
    init() { if (abrir && CALC.actividad(abrir)) this.sel = abrir; },
    get a() { return this.sel ? CALC.actividad(this.sel) : null; },

    // El rol técnico solo ve sus propias actividades
    visibles() {
      const rows = Alpine.store('db').actividades;
      if (Alpine.store('ui').role === 'tecnico') {
        const yo = Alpine.store('db').sesion.tecnicoDemoId;
        return rows.filter(r => r.tecnicos.includes(yo));
      }
      return rows;
    },
    filas() {
      return this.visibles().map(a => ({
        ...a,
        tipo: CALC.tipo(a.tipoId).nombre,
        sitio: CALC.sitio(a.sitioId).codigo,
        proyecto: CALC.proyecto(a.proyectoId).codigo,
        avance: CALC.avanceActividad(a),
      }));
    },
    deColumna(col) {
      return this.visibles().filter(a => col.estados.includes(a.estado))
        .sort((x, y) => (x.fecha + x.hIni).localeCompare(y.fecha + y.hIni));
    },

    /* ── Acciones con validación ── */
    async iniciar() { await ACCIONES.iniciarActividad(this.sel, Alpine.store('db').sesion.usuario); Alpine.store('toasts').push('info', 'Actividad iniciada', this.sel); },
    async finalizar(id = this.sel) {
      const r = await ACCIONES.finalizarActividad(id, Alpine.store('db').sesion.usuario);
      if (!r.ok) {
        Alpine.store('toasts').push('error', 'No se puede cerrar todavía', 'Falta: ' + (r.faltantes || []).join(' · '));
        return false;
      }
      Alpine.store('toasts').push('ok', 'Cierre enviado a revisión', `${id} espera aprobación del supervisor.`);
      return true;
    },
    async aprobar(id = this.sel) {
      const a = CALC.actividad(id); const pid = a.proyectoId;
      await ACCIONES.aprobarActividad(id, Alpine.store('db').sesion.usuario);
      Alpine.store('toasts').push('ok', 'Cierre aprobado', `Avance del proyecto ${CALC.proyecto(pid).codigo}: ${CALC.avanceProyecto(pid)}%`);
    },
    async rechazar() {
      if (this.motivoRechazo.trim().length < 5) { Alpine.store('toasts').push('error', 'Indica el motivo del rechazo'); return; }
      await ACCIONES.rechazarActividad(this.sel, this.motivoRechazo.trim(), Alpine.store('db').sesion.usuario);
      Alpine.store('toasts').push('warn', 'Cierre rechazado', 'La actividad volvió a la cuadrilla en ejecución.');
      this.rechazando = false; this.motivoRechazo = '';
    },
    marcar(idx) { ACCIONES.toggleChecklist(this.sel, idx, Alpine.store('db').sesion.usuario); },
    // Con backend abre el selector/cámara; sin él registra la evidencia simulada
    tomarFoto(tipo, titulo) {
      if (API.estaEnDemo()) return this.subirEvidencia(tipo, titulo);
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
      inp.onchange = () => {
        if (!inp.files || !inp.files[0]) return;
        Alpine.store('toasts').push('info', 'Subiendo foto…', 'Se comprime antes de enviar.');
        this.subirEvidencia(tipo, titulo, inp.files[0]);
      };
      inp.click();
    },
    async subirEvidencia(tipo, titulo, file = null) {
      const id = await ACCIONES.subirEvidencia(this.sel, tipo, titulo, Alpine.store('db').sesion.usuario, Alpine.store('db').sesion.tecnicoDemoId, file);
      if (id) Alpine.store('toasts').push('ok', 'Evidencia subida', titulo);
    },

    /* ── Kanban: arrastre con transiciones permitidas ── */
    puedeMover(a, colId) {
      if (!a) return false;
      const desde = a.estado === 'retrasada' ? 'pendiente' : a.estado;
      const ui = Alpine.store('ui');
      const legal = {
        pendiente: ['en_ejecucion'],
        en_ejecucion: ['en_revision'],
        en_revision: ['completada', 'en_ejecucion'],
        completada: [],
      };
      if (!legal[desde] || !legal[desde].includes(colId)) return false;
      if (colId === 'completada' && !ui.puede('aprobar')) return false;
      return true;
    },
    async soltar(colId) {
      const a = CALC.actividad(this.dragId);
      this.colSobre = null;
      if (!a || !this.puedeMover(a, colId)) {
        if (a && (a.estado === 'retrasada' ? 'pendiente' : a.estado) !== colId) {
          Alpine.store('toasts').push('warn', 'Movimiento no permitido', 'El flujo es Pendiente → En ejecución → En revisión → Completada (aprueba el supervisor).');
        }
        this.dragId = null; return;
      }
      const u = Alpine.store('db').sesion.usuario;
      if (colId === 'en_ejecucion' && ['pendiente', 'retrasada'].includes(a.estado)) {
        await ACCIONES.iniciarActividad(a.id, u);
        Alpine.store('toasts').push('info', 'Actividad iniciada', a.id);
      } else if (colId === 'en_revision') {
        await this.finalizar(a.id);
      } else if (colId === 'completada') {
        await this.aprobar(a.id);
      } else if (colId === 'en_ejecucion' && a.estado === 'en_revision') {
        this.sel = a.id; this.rechazando = true; // rechazo requiere motivo
      }
      this.dragId = null;
    },
  };
}

export default {
  title: "Actividades",
  roles: ["admin", "supervisor", "tecnico"],
  deps: [],
  componente: "actividadesPage",
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="actividadesPage()">

  <template x-if="$store.ui.view==='loading'"><div x-html="UI.skel.table(10,8)"></div></template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8" x-html="UI.emptyState({ icon:'clipboard', title:'No hay actividades registradas', desc:'Programa la primera actividad desde la Agenda para empezar a controlar el avance.', action: UI.btn({label:'Ir a la Agenda', icon:'calendar', attrs:\`onclick=&quot;App.ir('agenda')&quot;\`}) })"></div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8" x-html="UI.errorState({ desc:'El listado de actividades no respondió a tiempo.', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>

  <div x-show="$store.ui.view==='data'"
    x-data="dataTable({ rows: () => filas(), sortKey: 'fecha', sortDir: 'desc', pageSize: 12, filters: { estado: '', proyecto: '' } })" class="space-y-3">

    <div class="flex flex-wrap items-center gap-2">
      <!-- Conmutador de vista -->
      <div class="seg" role="group" aria-label="Vista">
        <button :class="vista==='tabla' && 'is-on'" @click="vista='tabla'" :aria-pressed="vista==='tabla'">Tabla</button>
        <button :class="vista==='kanban' && 'is-on'" @click="vista='kanban'" :aria-pressed="vista==='kanban'">Kanban</button>
      </div>
      <div class="relative" x-show="vista==='tabla'">
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" x-html="UI.icon('search',14)"></span>
        <input type="search" class="ui-input pl-8" style="width:220px" placeholder="ID, sitio, tipo, técnico…" x-model="q" aria-label="Buscar actividad">
      </div>
      <select class="ui-select" style="width:160px" x-model="filters.estado" x-show="vista==='tabla'" aria-label="Estado">
        <option value="">Todos los estados</option><option value="pendiente">Pendiente</option><option value="en_ejecucion">En ejecución</option>
        <option value="en_revision">En revisión</option><option value="completada">Completada</option>
        <option value="retrasada">Retrasada</option><option value="cancelada">Cancelada</option>
      </select>
      <select class="ui-select" style="width:170px" x-model="filters.proyecto" x-show="vista==='tabla'" aria-label="Proyecto">
        <option value="">Todos los proyectos</option>
        <template x-for="p in $store.db.proyectos"><option :value="p.codigo" x-text="p.codigo"></option></template>
      </select>
      <button class="ui-btn ui-btn-ghost ui-btn-sm" x-show="vista==='tabla'" @click="resetFilters()">Limpiar</button>
      <button class="ui-btn ui-btn-primary ui-btn-md ml-auto" x-show="$store.ui.puede('asignar')"
        onclick="App.ir('agenda')" x-html="UI.icon('plus',15)+' Programar actividad'"></button>
    </div>

    <!-- ══ Vista tabla ══ -->
    <div x-show="vista==='tabla'" class="space-y-3">
      <div class="ui-table-wrap">
        <table class="ui-table" aria-label="Actividades">
          <thead><tr>
            <th class="col-sticky" style="width:36px"><input type="checkbox" class="ui-check" :checked="allPageSel" @change="toggleAll()" aria-label="Seleccionar página"></th>
            <th class="sortable" @click="sortBy('id')">ID <span x-text="sortIcon('id')"></span></th>
            <th>Actividad</th>
            <th class="sortable" @click="sortBy('sitio')">Sitio <span x-text="sortIcon('sitio')"></span></th>
            <th class="sortable" @click="sortBy('proyecto')">Proyecto <span x-text="sortIcon('proyecto')"></span></th>
            <th>Cuadrilla</th>
            <th class="sortable" @click="sortBy('fecha')">Fecha <span x-text="sortIcon('fecha')"></span></th>
            <th>Horario</th>
            <th class="sortable" @click="sortBy('estado')">Estado <span x-text="sortIcon('estado')"></span></th>
            <th class="sortable" @click="sortBy('avance')">Avance <span x-text="sortIcon('avance')"></span></th>
            <th><span class="sr-only">Acciones</span></th>
          </tr></thead>
          <tbody>
            <template x-for="r in paged" :key="r.id">
              <tr :class="isSel(r.id) && 'is-selected'">
                <td class="col-sticky"><input type="checkbox" class="ui-check" :checked="isSel(r.id)" @change="toggleSel(r.id)" :aria-label="'Seleccionar '+r.id"></td>
                <td class="mono text-xs" x-text="r.id"></td>
                <td class="max-w-[200px] truncate" :title="r.tipo" x-text="r.tipo"></td>
                <td class="mono text-xs" x-text="r.sitio"></td>
                <td class="mono text-xs" x-text="r.proyecto"></td>
                <td><span class="ui-avatar-stack" x-html="r.tecnicos.map(t=>UI.avatar(CALC.tecnico(t),24)).join('')"></span></td>
                <td class="mono text-xs" x-text="UI.fmt.fecha(r.fecha)"></td>
                <td class="mono text-xs" x-text="r.hIni+'–'+r.hFin"></td>
                <td x-html="UI.badge(r.estado)"></td>
                <td x-html="UI.progress(r.avance, {estado: r.estado==='retrasada' ? 'critico' : ''})"></td>
                <td class="row-actions text-right whitespace-nowrap">
                  <button class="ui-btn ui-btn-secondary ui-btn-sm" x-show="r.estado==='en_revision' && $store.ui.puede('aprobar')"
                    @click="aprobar(r.id)" x-html="UI.icon('check',12)+' Aprobar'"></button>
                  <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="sel = r.id" x-tooltip="'Abrir detalle y checklist'" aria-label="Abrir detalle" x-html="UI.icon('eye',14)"></button>
                </td>
              </tr>
            </template>
            <tr x-show="!filtered.length"><td colspan="11" x-html="UI.emptyState({icon:'search', title:'Sin resultados', desc:'Ninguna actividad coincide con los filtros aplicados.'})"></td></tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-xs">
        <span class="mono text-ink-2" x-text="rangeLabel"></span>
        <div class="flex gap-1">
          <button class="ui-btn ui-btn-ghost ui-btn-sm" :disabled="page<=1" @click="page--" aria-label="Anterior" x-html="UI.icon('chevronLeft',14)"></button>
          <span class="mono self-center px-1 text-ink-2" x-text="\`\${page} / \${totalPages}\`"></span>
          <button class="ui-btn ui-btn-ghost ui-btn-sm" :disabled="page>=totalPages" @click="page++" aria-label="Siguiente" x-html="UI.icon('chevronRight',14)"></button>
        </div>
      </div>
    </div>

    <!-- ══ Vista Kanban ══ -->
    <div x-show="vista==='kanban'" x-cloak class="space-y-2">
      <p class="text-xs text-ink-3">Arrastra una tarjeta al siguiente estado. El flujo es Pendiente → En ejecución → En revisión → Completada; para cerrar se exige checklist completo y fotos de antes/después, y solo el supervisor aprueba.</p>
      <div class="kb-board">
        <template x-for="col in columnas" :key="col.id">
          <section class="kb-col"
            :class="colSobre===col.id && (puedeMover(CALC.actividad(dragId), col.id) ? 'is-over' : 'is-forbidden')"
            @dragover.prevent="colSobre=col.id"
            @dragleave="colSobre===col.id && (colSobre=null)"
            @drop.prevent="soltar(col.id)"
            :aria-label="'Columna ' + col.label">
            <div class="kb-head">
              <span x-html="UI.badge(col.estados[0], col.label)"></span>
              <span class="kb-count" x-text="deColumna(col).length"></span>
            </div>
            <div class="kb-cards">
              <template x-for="act in deColumna(col)" :key="act.id">
                <article class="kb-card" draggable="true"
                  :class="dragId===act.id && 'is-dragging'"
                  @dragstart="dragId=act.id" @dragend="dragId=null; colSobre=null"
                  @click="sel=act.id" role="button" tabindex="0"
                  @keydown.enter="sel=act.id"
                  :aria-label="act.id + ' ' + CALC.tipo(act.tipoId).nombre">
                  <div class="flex items-center justify-between gap-2">
                    <span class="kb-id" x-text="act.id"></span>
                    <span x-show="act.estado==='retrasada'" x-html="UI.badge('retrasada')"></span>
                  </div>
                  <p class="kb-t" x-text="CALC.tipo(act.tipoId).nombre"></p>
                  <p class="kb-id" x-text="CALC.sitio(act.sitioId).codigo + ' · ' + UI.fmt.fechaCorta(act.fecha) + ' ' + act.hIni"></p>
                  <div class="kb-meta">
                    <span class="ui-avatar-stack" x-html="act.tecnicos.map(t=>UI.avatar(CALC.tecnico(t),24)).join('')"></span>
                    <span class="w-20" x-show="act.estado==='en_ejecucion' && act.checklist.length" x-html="UI.progress(CALC.avanceActividad(act))"></span>
                  </div>
                </article>
              </template>
              <p class="text-xs text-ink-3 text-center py-4" x-show="!deColumna(col).length">Sin actividades</p>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>

  <!-- Drawer: detalle + checklist + cierre validado + aprobación -->
  <template x-if="a">
    <div @keydown.escape.window="sel=null; rechazando=false">
      <div class="ui-backdrop" @click="sel=null; rechazando=false" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <aside class="ui-drawer" style="max-width:500px" x-transition:enter="slide-enter" x-transition:enter-start="slide-enter-start" role="dialog" aria-modal="true" aria-label="Detalle de actividad">
        <div class="ui-drawer-head">
          <div>
            <div class="flex items-center gap-2">
              <p class="mono text-sm font-semibold" x-text="a.id"></p>
              <span x-html="UI.badge(a.estado)"></span>
            </div>
            <p class="text-xs text-ink-3 mt-0.5" x-text="CALC.tipo(a.tipoId).nombre + ' · ' + CALC.sitio(a.sitioId).codigo"></p>
          </div>
          <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="sel=null; rechazando=false" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
        </div>

        <div class="ui-drawer-body space-y-5">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Fecha</p><p class="mono text-xs mt-1" x-text="UI.fmt.diaLargo(a.fecha)"></p></div>
            <div><p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Horario plan</p><p class="mono text-xs mt-1" x-text="a.hIni+'–'+a.hFin"></p></div>
            <div><p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Inicio real</p><p class="mono text-xs mt-1" x-text="a.inicioReal || '—'"></p></div>
            <div><p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Fin real</p><p class="mono text-xs mt-1" x-text="a.finReal || '—'"></p></div>
          </div>

          <div>
            <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide mb-2">Cuadrilla</p>
            <div class="space-y-2">
              <template x-for="t in a.tecnicos" :key="t">
                <div class="flex items-center gap-2.5">
                  <span x-html="UI.avatar(CALC.tecnico(t), 32)"></span>
                  <div><p class="text-sm font-medium" x-text="CALC.tecnico(t).nombre"></p><p class="text-xs text-ink-3" x-text="CALC.tecnico(t).rol"></p></div>
                </div>
              </template>
            </div>
          </div>

          <!-- Requisitos de cierre en vivo -->
          <div x-show="['en_ejecucion','retrasada'].includes(a.estado)" class="border border-line rounded-md p-3 bg-surface-2">
            <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide mb-2">Requisitos para cerrar</p>
            <ul class="space-y-1.5 text-sm">
              <li class="flex items-center gap-2" :style="!a.checklist.length || a.checklist.every(i=>i.ok) ? 'color:var(--st-completado)' : 'color:var(--st-pendiente)'">
                <span x-html="UI.icon(!a.checklist.length || a.checklist.every(i=>i.ok) ? 'checkCircle' : 'clock', 14)"></span>
                <span x-text="a.checklist.length ? \`Checklist completo (\${a.checklist.filter(i=>i.ok).length}/\${a.checklist.length})\` : 'Sin checklist estructurado'"></span>
              </li>
              <li class="flex items-center gap-2" :style="CALC.evidenciasDeActividad(a.id).some(e=>e.tipo==='foto_antes') ? 'color:var(--st-completado)' : 'color:var(--st-pendiente)'">
                <span x-html="UI.icon(CALC.evidenciasDeActividad(a.id).some(e=>e.tipo==='foto_antes') ? 'checkCircle' : 'camera', 14)"></span>
                <span>Foto de antes del trabajo</span>
              </li>
              <li class="flex items-center gap-2" :style="CALC.evidenciasDeActividad(a.id).some(e=>['foto_despues','foto_avance'].includes(e.tipo)) ? 'color:var(--st-completado)' : 'color:var(--st-pendiente)'">
                <span x-html="UI.icon(CALC.evidenciasDeActividad(a.id).some(e=>['foto_despues','foto_avance'].includes(e.tipo)) ? 'checkCircle' : 'camera', 14)"></span>
                <span>Foto de después del trabajo</span>
              </li>
            </ul>
          </div>

          <!-- Checklist con porcentaje en vivo -->
          <div x-show="a.checklist.length">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Checklist de trabajo</p>
              <span class="mono text-xs text-ink-2" x-text="a.checklist.filter(i=>i.ok).length + ' / ' + a.checklist.length"></span>
            </div>
            <div class="mb-3" x-html="UI.progress(CALC.avanceActividad(a))"></div>
            <ul class="space-y-1.5" role="list">
              <template x-for="(item, idx) in a.checklist" :key="idx">
                <li>
                  <label class="flex items-start gap-2.5 p-2 rounded-md hover:bg-surface-2 tr-150 cursor-pointer"
                    :class="a.estado!=='en_ejecucion' && 'opacity-60 pointer-events-none'">
                    <input type="checkbox" class="ui-check mt-0.5" :checked="item.ok" @change="marcar(idx)"
                      :disabled="a.estado!=='en_ejecucion'">
                    <span class="text-sm" :class="item.ok && 'line-through text-ink-3'" x-text="item.t"></span>
                  </label>
                </li>
              </template>
            </ul>
          </div>

          <div x-show="a.obs">
            <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide mb-1.5">Observaciones de campo</p>
            <p class="text-sm text-ink-2 bg-surface-2 border border-line rounded-md p-3" x-text="a.obs"></p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide">Evidencias</p>
              <span class="flex gap-1.5" x-show="['en_ejecucion','retrasada'].includes(a.estado)">
                <button class="ui-btn ui-btn-secondary ui-btn-sm" @click="tomarFoto('foto_antes','Foto antes del trabajo')" x-html="UI.icon('camera',12)+' Antes'"></button>
                <button class="ui-btn ui-btn-secondary ui-btn-sm" @click="tomarFoto('foto_despues','Foto después del trabajo')" x-html="UI.icon('camera',12)+' Después'"></button>
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2" x-show="CALC.evidenciasDeActividad(a.id).length">
              <template x-for="e in CALC.evidenciasDeActividad(a.id)" :key="e.id">
                <figure>
                  <img :src="e.archivo" :alt="e.titulo" loading="lazy" class="w-full h-20 object-cover rounded-md border border-line">
                  <figcaption class="mono text-xs text-ink-3 mt-1 truncate" x-text="e.hora + ' · ' + e.titulo"></figcaption>
                </figure>
              </template>
            </div>
            <p class="text-xs text-ink-3" x-show="!CALC.evidenciasDeActividad(a.id).length">Sin evidencias aún. El cierre exige foto de antes y de después.</p>
          </div>

          <!-- Panel de rechazo (supervisor) -->
          <div x-show="rechazando" x-cloak class="border rounded-md p-3" style="border-color:var(--st-critico-bd);background:var(--st-critico-bg)">
            <label class="ui-label" for="mot-rech">Motivo del rechazo *</label>
            <textarea id="mot-rech" class="ui-textarea" x-model="motivoRechazo"
              placeholder="Ej. Falta evidencia fotográfica del después; regularizar antes de reenviar."></textarea>
            <div class="flex gap-2 justify-end mt-2">
              <button class="ui-btn ui-btn-secondary ui-btn-sm" @click="rechazando=false">Cancelar</button>
              <button class="ui-btn ui-btn-danger ui-btn-sm" @click="rechazar()">Confirmar rechazo</button>
            </div>
          </div>
        </div>

        <div class="ui-drawer-foot">
          <button class="ui-btn ui-btn-danger ui-btn-md mr-auto" x-show="['pendiente','retrasada'].includes(a.estado) && $store.ui.puede('editar')"
            @click="await ACCIONES.cancelarActividad(a.id, 'decisión del supervisor', $store.db.sesion.usuario); $store.toasts.push('warn','Actividad cancelada', a.id)">Cancelar</button>
          <button class="ui-btn ui-btn-secondary ui-btn-md" @click="sel=null; rechazando=false">Cerrar</button>
          <button class="ui-btn ui-btn-primary ui-btn-md" x-show="['pendiente','retrasada'].includes(a.estado)" @click="iniciar()" x-html="UI.icon('play',13)+' Iniciar'"></button>
          <button class="ui-btn ui-btn-primary ui-btn-md" x-show="a.estado==='en_ejecucion'" @click="finalizar()" x-html="UI.icon('check',13)+' Finalizar'"></button>
          <template x-if="a.estado==='en_revision'">
            <span class="flex gap-2">
              <button class="ui-btn ui-btn-secondary ui-btn-md" x-show="$store.ui.puede('aprobar')" @click="rechazando=true" x-html="UI.icon('x',13)+' Rechazar'"></button>
              <button class="ui-btn ui-btn-primary ui-btn-md" x-show="$store.ui.puede('aprobar')" @click="aprobar()" x-html="UI.icon('check',13)+' Aprobar cierre'"></button>
              <span class="text-xs text-ink-3 self-center" x-show="!$store.ui.puede('aprobar')">Esperando aprobación del supervisor</span>
            </span>
          </template>
        </div>
      </aside>
    </div>
  </template>
</div>`,
};
