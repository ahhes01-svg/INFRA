/* ============================================================================
 * materiales.js — Vista «Materiales»
 * Módulo cargado bajo demanda por js/core/router.js
 * ==========================================================================*/
const CATEGORIAS_MAT = ['RF', 'Radio', 'Energía', 'Obra', 'Transmisión', 'Seguridad', 'Herramienta'];
const UNIDADES_MAT = ['und', 'rollo', 'caja', 'kit', 'banco', 'gal', 'm', 'kg'];

export const state = () => {
  const vacio = () => ({
    id: null, nombre: '', categoria: 'RF', unidad: 'und',
    stock: 0, minimo: 1, almacen: 'Almacén Ica', proyectoId: '',
  });
  return {
    menu: null, mx: 0, my: 0,
    kardex: null,              // materialId del drawer de kardex
    despacho: null,            // { matId, cantidad, actividadId }
    ingreso: null,             // { matId, cantidad }
    form: null,                // material en edición
    borrando: null,
    guardando: false, tocado: false,
    fProyecto: '', fSitio: '', // filtros por proyecto y BTS
    CATEGORIAS_MAT, UNIDADES_MAT,

    mat(id) { return Alpine.store('db').materiales.find(m => m.id === id) || {}; },
    get actividadesActivas() {
      return Alpine.store('db').actividades.filter(a => ['pendiente', 'en_ejecucion', 'retrasada'].includes(a.estado));
    },

    /* ── Filtros por proyecto y BTS ──
     * Por proyecto: material reservado a ese proyecto + el de uso general.
     * Por BTS: material que ya se despachó a ese sitio (según el kardex).    */
    filas() {
      const db = Alpine.store('db');
      let rows = db.materiales;
      if (this.fProyecto) rows = rows.filter(m => m.proyectoId === this.fProyecto || !m.proyectoId);
      if (this.fSitio) {
        const usados = new Set(db.movimientos.filter(mv => mv.sitioId === this.fSitio).map(mv => mv.materialId));
        rows = rows.filter(m => usados.has(m.id));
      }
      return rows.map(m => ({
        ...m,
        estado: CALC.estadoMaterial(m),
        proyecto: m.proyectoId ? CALC.proyecto(m.proyectoId).codigo : 'General',
      }));
    },
    // Cuánto de este material se despachó al sitio filtrado
    despachadoASitio(matId) {
      if (!this.fSitio) return null;
      return Alpine.store('db').movimientos
        .filter(mv => mv.materialId === matId && mv.sitioId === this.fSitio && mv.tipo === 'despacho')
        .reduce((s, mv) => s + mv.cantidad, 0);
    },

    /* ── Alta y edición ── */
    nuevo() { this.form = vacio(); this.form.proyectoId = this.fProyecto || ''; this.tocado = false; this.menu = null; },
    editar(id) { this.form = { ...this.mat(id) }; this.tocado = false; this.menu = null; },
    get errNombre() {
      if (!this.tocado) return '';
      return (this.form.nombre || '').trim().length < 3 ? 'Describe el material' : '';
    },
    async guardar() {
      this.tocado = true;
      if (this.errNombre) return;
      this.guardando = true;
      const r = await ACCIONES.guardarMaterial(this.form);
      this.guardando = false;
      if (!r.ok) { Alpine.store('toasts').push('error', 'No se pudo guardar', r.error); return; }
      Alpine.store('toasts').push('ok', r.creado ? 'Material registrado' : 'Ficha actualizada', this.form.nombre);
      this.form = null;
    },
    async confirmarBorrado() {
      const m = this.borrando;
      const r = await ACCIONES.eliminarMaterial(m.id);
      if (!r.ok) { Alpine.store('toasts').push('error', 'No se puede eliminar', r.error); this.borrando = null; return; }
      Alpine.store('toasts').push('ok', 'Material eliminado', m.nombre);
      this.borrando = null;
    },

    abrirDespacho(id) { this.despacho = { matId: id, cantidad: 1, actividadId: this.actividadesActivas[0]?.id || '' }; this.menu = null; },
    abrirIngreso(id) { this.ingreso = { matId: id, cantidad: 1 }; this.menu = null; },
    async confirmarDespacho() {
      const d = this.despacho;
      const r = await ACCIONES.despacharMaterial(d.matId, d.cantidad, d.actividadId, Alpine.store('db').sesion.usuario);
      if (!r.ok) { Alpine.store('toasts').push('error', 'Despacho rechazado', r.error); return; }
      const m = this.mat(d.matId);
      Alpine.store('toasts').push('ok', 'Material despachado',
        `${d.cantidad} ${m.unidad} de ${m.nombre} → ${d.actividadId}. Stock restante: ${m.stock}.`);
      this.despacho = null;
    },
    async confirmarIngreso() {
      const i = this.ingreso;
      await ACCIONES.ingresarMaterial(i.matId, i.cantidad, Alpine.store('db').sesion.usuario);
      Alpine.store('toasts').push('ok', 'Ingreso registrado', `Stock actual: ${this.mat(i.matId).stock} ${this.mat(i.matId).unidad}.`);
      this.ingreso = null;
    },
  };
}

export default {
  title: "Materiales",
  roles: ["admin"],
  deps: [],
  componente: "materialesPage",
  state: typeof state !== 'undefined' ? state : null,
  html: `<div x-data="materialesPage()">

  <template x-if="$store.ui.view==='loading'">
    <div class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3" x-html="UI.skel.kpis(3)"></div>
      <div x-html="UI.skel.table(10,6)"></div>
    </div>
  </template>
  <template x-if="$store.ui.view==='empty'">
    <div class="ui-card mt-8" x-html="UI.emptyState({ icon:'box', title:'Almacén sin materiales', desc:'Registra los materiales y repuestos para controlar stock y mínimos.', action: UI.btn({label:'Registrar material', icon:'plus'}) })"></div>
  </template>
  <template x-if="$store.ui.view==='error'">
    <div class="ui-card mt-8" x-html="UI.errorState({ desc:'El sistema de almacén no respondió (ERP fuera de línea).', retryAttr:\`@click=&quot;$store.ui.setView('data')&quot;\` })"></div>
  </template>

  <div x-show="$store.ui.view==='data'" class="space-y-4"
    x-data="dataTable({ rows: () => filas(), sortKey: 'id', pageSize: 10, filters: { estado: '', categoria: '' } })">

    <section class="grid grid-cols-2 md:grid-cols-3 gap-3" aria-label="Resumen de almacén">
      <div class="ui-card ui-kpi"><span class="kpi-label" x-html="UI.icon('box',13)+'Ítems en catálogo'"></span><span class="kpi-value" x-countup="$store.db.materiales.length">0</span></div>
      <div class="ui-card ui-kpi"><span class="kpi-label" x-html="UI.icon('arrowDown',13)+'Bajo mínimo'"></span><span class="kpi-value" style="color:var(--st-pendiente)" x-countup="$store.db.materiales.filter(m=>CALC.estadoMaterial(m)==='stock_bajo').length">0</span></div>
      <div class="ui-card ui-kpi"><span class="kpi-label" x-html="UI.icon('alertCircle',13)+'Sin stock'"></span><span class="kpi-value" style="color:var(--st-critico)" x-countup="$store.db.materiales.filter(m=>CALC.estadoMaterial(m)==='sin_stock').length">0</span></div>
    </section>

    <div class="p-3 rounded-md border text-sm flex gap-2.5 items-start" role="note"
      x-show="$store.db.materiales.some(m=>CALC.estadoMaterial(m)==='sin_stock')"
      style="background:var(--st-critico-bg);border-color:var(--st-critico-bd)">
      <span style="color:var(--st-critico)" x-html="UI.icon('alert',16)"></span>
      <p class="text-ink-2"><span class="font-semibold text-ink-1">Stock crítico:</span>
        el rectificador 48 V (MAT-007) está en cero y bloquea el correctivo <span class="mono text-xs">ACT-0024</span> de IC-PARCONA-0233, cuya incidencia crítica está vencida.</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" x-html="UI.icon('search',14)"></span>
        <input type="search" class="ui-input pl-8" style="width:230px" placeholder="Código o descripción…" x-model="q" aria-label="Buscar material">
      </div>
      <select class="ui-select" style="width:150px" x-model="filters.categoria" aria-label="Categoría">
        <option value="">Toda categoría</option><option>RF</option><option>Radio</option><option>Energía</option><option>Obra</option>
      </select>
      <select class="ui-select" style="width:150px" x-model="filters.estado" aria-label="Estado de stock">
        <option value="">Todo estado</option><option value="disponible">Disponible</option>
        <option value="stock_bajo">Stock bajo</option><option value="sin_stock">Sin stock</option>
      </select>
      <select class="ui-select" style="width:165px" x-model="fProyecto" aria-label="Filtrar por proyecto">
        <option value="">Todos los proyectos</option>
        <template x-for="p in $store.db.proyectos" :key="p.id"><option :value="p.id" x-text="p.codigo"></option></template>
      </select>
      <select class="ui-select mono text-xs" style="width:180px" x-model="fSitio" aria-label="Filtrar por BTS">
        <option value="">Todos los BTS</option>
        <template x-for="s in $store.db.sitios.slice(0,20)" :key="s.id"><option :value="s.id" x-text="s.codigo"></option></template>
      </select>
      <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="resetFilters(); fProyecto=''; fSitio=''">Limpiar</button>
      <button class="ui-btn ui-btn-primary ui-btn-md ml-auto" x-show="$store.ui.puede('crear')" @click="nuevo()"
        x-html="UI.icon('plus',15)+' Registrar material'"></button>
    </div>

    <!-- Contexto del filtro activo -->
    <p class="text-xs text-ink-2 flex items-center gap-1.5" x-show="fProyecto || fSitio" x-cloak>
      <span x-html="UI.icon('filter',13)"></span>
      <span x-show="fProyecto" x-text="\`Material del proyecto \${CALC.proyecto(fProyecto).codigo} y de uso general.\`"></span>
      <span x-show="fSitio" x-text="\`Solo material ya despachado a \${CALC.sitio(fSitio).codigo}.\`"></span>
    </p>

    <div class="ui-table-wrap">
      <table class="ui-table" aria-label="Materiales en almacén">
        <thead><tr>
          <th class="col-sticky sortable" @click="sortBy('id')">Código <span x-text="sortIcon('id')"></span></th>
          <th class="sortable" @click="sortBy('nombre')">Material <span x-text="sortIcon('nombre')"></span></th>
          <th>Categoría</th>
          <th class="sortable" @click="sortBy('proyecto')">Proyecto <span x-text="sortIcon('proyecto')"></span></th>
          <th>Almacén</th>
          <th class="sortable text-right" @click="sortBy('stock')">Stock <span x-text="sortIcon('stock')"></span></th>
          <th class="text-right">Mínimo</th><th>Nivel</th><th>Estado</th>
          <th class="text-right" x-show="fSitio">A este BTS</th>
          <th><span class="sr-only">Acciones</span></th>
        </tr></thead>
        <tbody>
          <template x-for="m in paged" :key="m.id">
            <tr @contextmenu.prevent="menu=m.id; mx=Math.min($event.clientX, innerWidth-200); my=Math.min($event.clientY, innerHeight-170)">
              <td class="col-sticky mono text-xs" x-text="m.id"></td>
              <td x-text="m.nombre"></td>
              <td class="text-xs" x-text="m.categoria"></td>
              <td class="text-xs">
                <span class="mono" :class="m.proyectoId ? 'text-brand-600 dark:text-brand-400' : 'text-ink-3'" x-text="m.proyecto"></span>
              </td>
              <td class="text-xs" x-text="m.almacen"></td>
              <td class="mono text-right" :style="m.stock===0 ? 'color:var(--st-critico);font-weight:600' : ''" x-text="m.stock + ' ' + m.unidad"></td>
              <td class="mono text-right text-ink-3" x-text="m.minimo"></td>
              <td x-html="UI.progress(Math.min(100, m.stock / (m.minimo*2) * 100), { estado: m.stock < m.minimo ? 'critico' : '' })"></td>
              <td x-html="UI.badge(m.estado)"></td>
              <td class="mono text-xs text-right" x-show="fSitio" x-text="(despachadoASitio(m.id) || 0) + ' ' + m.unidad"></td>
              <td class="row-actions text-right whitespace-nowrap">
                <button class="ui-btn ui-btn-ghost ui-btn-sm" x-show="$store.ui.puede('crear')"
                  @click="editar(m.id)" x-tooltip="'Editar material'" aria-label="Editar" x-html="UI.icon('edit',14)"></button>
                <button class="ui-btn ui-btn-ghost ui-btn-sm" x-tooltip="'Más acciones'" @click="menu=m.id; mx=Math.min($event.clientX, innerWidth-200); my=Math.min($event.clientY, innerHeight-200)" aria-label="Acciones" x-html="UI.icon('dots',14)"></button>
              </td>
            </tr>
          </template>
          <tr x-show="!filtered.length"><td colspan="11" x-html="UI.emptyState({icon:'search', title:'Sin resultados', desc:'Ningún material coincide con los filtros.'})"></td></tr>
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

  <!-- Menú contextual de material -->
  <template x-if="menu">
    <div class="fixed inset-0 z-50" @click="menu=null" @keydown.escape.window="menu=null">
      <div class="ui-menu shadow-e2" :style="\`left:\${mx}px;top:\${my}px\`" role="menu">
        <button class="ui-menu-item" role="menuitem" @click="abrirIngreso(menu)"><span x-html="UI.icon('arrowUp',14)"></span> Registrar ingreso</button>
        <button class="ui-menu-item" role="menuitem" @click="abrirDespacho(menu)"><span x-html="UI.icon('arrowDown',14)"></span> Despachar a actividad</button>
        <button class="ui-menu-item" role="menuitem" @click="kardex=menu; menu=null"><span x-html="UI.icon('file',14)"></span> Ver kardex</button>
        <div class="ui-menu-sep"></div>
        <button class="ui-menu-item" role="menuitem" x-show="$store.ui.puede('crear')" @click="editar(menu)"><span x-html="UI.icon('edit',14)"></span> Editar ficha</button>
        <button class="ui-menu-item is-danger" role="menuitem" x-show="$store.ui.puede('crear')" @click="borrando = mat(menu); menu=null"><span x-html="UI.icon('trash',14)"></span> Eliminar material</button>
      </div>
    </div>
  </template>

  <!-- ══ Modal: alta / edición de material ══ -->
  <template x-if="form">
    <div @keydown.escape.window="form=null">
      <div class="ui-backdrop" @click="form=null" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <div class="ui-modal" role="dialog" aria-modal="true" aria-labelledby="mat-t">
        <div class="ui-modal-box" style="max-width:560px" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
          <div class="ui-modal-head">
            <h3 class="font-semibold" id="mat-t" x-text="form.id ? 'Editar material' : 'Registrar material'"></h3>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="form=null" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
          </div>
          <div class="ui-modal-body space-y-4">
            <div>
              <label class="ui-label" for="mt-nom">Descripción del material *</label>
              <input id="mt-nom" class="ui-input" :class="errNombre && 'is-invalid'" x-model="form.nombre"
                placeholder="Ej. Jumper 1/2&quot; × 3 m, 4.3-10 M-M" @input="tocado=true" autofocus>
              <p class="ui-error" x-show="errNombre" x-cloak><span x-html="UI.icon('alertCircle',12)"></span><span x-text="errNombre"></span></p>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="ui-label" for="mt-cat">Categoría</label>
                <select id="mt-cat" class="ui-select" x-model="form.categoria">
                  <template x-for="c in CATEGORIAS_MAT" :key="c"><option :value="c" x-text="c"></option></template>
                </select>
              </div>
              <div>
                <label class="ui-label" for="mt-uni">Unidad de medida</label>
                <select id="mt-uni" class="ui-select" x-model="form.unidad">
                  <template x-for="u in UNIDADES_MAT" :key="u"><option :value="u" x-text="u"></option></template>
                </select>
              </div>
              <div>
                <label class="ui-label" for="mt-sto">Stock actual</label>
                <input id="mt-sto" type="number" min="0" class="ui-input mono" x-model.number="form.stock">
                <p class="ui-help" x-show="form.id">Cambiarlo aquí queda como ajuste en el kardex.</p>
              </div>
              <div>
                <label class="ui-label" for="mt-min">Stock mínimo</label>
                <input id="mt-min" type="number" min="0" class="ui-input mono" x-model.number="form.minimo">
                <p class="ui-help">Por debajo de este número se avisa.</p>
              </div>
              <div>
                <label class="ui-label" for="mt-alm">Almacén</label>
                <input id="mt-alm" class="ui-input" x-model="form.almacen" list="almacenes">
                <datalist id="almacenes"><option>Almacén Ica</option><option>Almacén Pisco</option><option>Almacén Nazca</option></datalist>
              </div>
              <div>
                <label class="ui-label" for="mt-pry">Proyecto asignado</label>
                <select id="mt-pry" class="ui-select" x-model="form.proyectoId">
                  <option value="">Uso general (cualquier proyecto)</option>
                  <template x-for="p in $store.db.proyectos" :key="p.id"><option :value="p.id" x-text="p.codigo + ' — ' + p.nombre"></option></template>
                </select>
                <p class="ui-help">Reserva este stock a un proyecto concreto.</p>
              </div>
            </div>
          </div>
          <div class="ui-modal-foot">
            <button class="ui-btn ui-btn-secondary ui-btn-md" @click="form=null">Cancelar</button>
            <button class="ui-btn ui-btn-primary ui-btn-md" :data-loading="guardando ? 1 : 0" @click="guardar()">
              <span class="spin" aria-hidden="true"></span>
              <span x-text="form.id ? 'Guardar cambios' : 'Registrar'"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- ══ Confirmación de eliminación ══ -->
  <template x-if="borrando">
    <div @keydown.escape.window="borrando=null">
      <div class="ui-backdrop" @click="borrando=null" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <div class="ui-modal" role="dialog" aria-modal="true" aria-labelledby="delm-t">
        <div class="ui-modal-box" style="max-width:440px" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
          <div class="ui-modal-head">
            <h3 class="font-semibold" id="delm-t">Eliminar material</h3>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="borrando=null" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
          </div>
          <div class="ui-modal-body space-y-3">
            <p class="text-sm">Vas a eliminar <span class="font-semibold" x-text="borrando.nombre"></span>
              (<span class="mono text-xs" x-text="borrando.id"></span>).</p>
            <div class="p-3 rounded-md border text-sm" style="background:var(--st-pendiente-bg);border-color:var(--st-pendiente-bd)">
              <p class="text-ink-2">Si el material tiene movimientos en el kardex no podrá eliminarse, para no descuadrar
                el historial de almacén. En ese caso pon el stock en 0.</p>
            </div>
          </div>
          <div class="ui-modal-foot">
            <button class="ui-btn ui-btn-secondary ui-btn-md" @click="borrando=null">Cancelar</button>
            <button class="ui-btn ui-btn-danger ui-btn-md" @click="confirmarBorrado()">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Modal: despachar a actividad (descuenta stock, alimenta kardex) -->
  <template x-if="despacho">
    <div @keydown.escape.window="despacho=null">
      <div class="ui-backdrop" @click="despacho=null" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <div class="ui-modal" role="dialog" aria-modal="true" aria-labelledby="dp-t">
        <div class="ui-modal-box" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
          <div class="ui-modal-head">
            <h3 class="font-semibold" id="dp-t">Despachar material</h3>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="despacho=null" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
          </div>
          <div class="ui-modal-body space-y-4">
            <div class="bg-surface-2 border border-line rounded-md p-3">
              <p class="font-medium text-sm" x-text="mat(despacho.matId).nombre"></p>
              <p class="mono text-xs text-ink-3 mt-0.5"
                x-text="\`\${despacho.matId} · stock \${mat(despacho.matId).stock} \${mat(despacho.matId).unidad} · \${mat(despacho.matId).almacen}\`"></p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="ui-label" for="dp-cant">Cantidad *</label>
                <input id="dp-cant" type="number" min="1" :max="mat(despacho.matId).stock" class="ui-input mono" x-model.number="despacho.cantidad">
                <p class="ui-error" x-show="despacho.cantidad > mat(despacho.matId).stock" x-cloak>
                  <span x-html="UI.icon('alertCircle',12)"></span>Supera el stock disponible</p>
              </div>
              <div>
                <label class="ui-label" for="dp-act">Actividad destino</label>
                <select id="dp-act" class="ui-select mono text-xs" x-model="despacho.actividadId">
                  <template x-for="a in actividadesActivas" :key="a.id">
                    <option :value="a.id" x-text="a.id + ' · ' + CALC.sitio(a.sitioId).codigo"></option>
                  </template>
                </select>
              </div>
            </div>
            <p class="ui-help">El despacho descuenta stock, se registra en el kardex y aparece en la ficha del sitio destino.</p>
          </div>
          <div class="ui-modal-foot">
            <button class="ui-btn ui-btn-secondary ui-btn-md" @click="despacho=null">Cancelar</button>
            <button class="ui-btn ui-btn-primary ui-btn-md"
              :disabled="!despacho.actividadId || despacho.cantidad < 1 || despacho.cantidad > mat(despacho.matId).stock"
              @click="confirmarDespacho()">Despachar</button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Modal: registrar ingreso -->
  <template x-if="ingreso">
    <div @keydown.escape.window="ingreso=null">
      <div class="ui-backdrop" @click="ingreso=null" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <div class="ui-modal" role="dialog" aria-modal="true" aria-labelledby="in-t">
        <div class="ui-modal-box" x-transition:enter="pop-enter" x-transition:enter-start="pop-enter-start">
          <div class="ui-modal-head">
            <h3 class="font-semibold" id="in-t">Registrar ingreso</h3>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="ingreso=null" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
          </div>
          <div class="ui-modal-body space-y-4">
            <div class="bg-surface-2 border border-line rounded-md p-3">
              <p class="font-medium text-sm" x-text="mat(ingreso.matId).nombre"></p>
              <p class="mono text-xs text-ink-3 mt-0.5" x-text="\`\${ingreso.matId} · stock actual \${mat(ingreso.matId).stock} \${mat(ingreso.matId).unidad}\`"></p>
            </div>
            <div>
              <label class="ui-label" for="in-cant">Cantidad que ingresa *</label>
              <input id="in-cant" type="number" min="1" class="ui-input mono" x-model.number="ingreso.cantidad">
            </div>
          </div>
          <div class="ui-modal-foot">
            <button class="ui-btn ui-btn-secondary ui-btn-md" @click="ingreso=null">Cancelar</button>
            <button class="ui-btn ui-btn-primary ui-btn-md" :disabled="ingreso.cantidad < 1" @click="confirmarIngreso()">Registrar</button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Drawer: kardex del material -->
  <template x-if="kardex">
    <div @keydown.escape.window="kardex=null">
      <div class="ui-backdrop" @click="kardex=null" x-transition:enter="fade-enter" x-transition:enter-start="fade-enter-start"></div>
      <aside class="ui-drawer" x-transition:enter="slide-enter" x-transition:enter-start="slide-enter-start" role="dialog" aria-modal="true" aria-label="Kardex del material">
        <div class="ui-drawer-head">
          <div>
            <p class="font-semibold" x-text="mat(kardex).nombre"></p>
            <p class="mono text-xs text-ink-3" x-text="\`\${kardex} · stock \${mat(kardex).stock} \${mat(kardex).unidad} · mínimo \${mat(kardex).minimo}\`"></p>
          </div>
          <button class="ui-btn ui-btn-ghost ui-btn-sm" @click="kardex=null" aria-label="Cerrar" x-html="UI.icon('x',15)"></button>
        </div>
        <div class="ui-drawer-body">
          <p class="text-xs text-ink-3 uppercase font-semibold tracking-wide mb-3">Movimientos</p>
          <div class="space-y-2.5" x-show="CALC.movimientosDeMaterial(kardex).length">
            <template x-for="mv in CALC.movimientosDeMaterial(kardex)" :key="mv.id">
              <div class="flex items-start gap-2.5 border border-line rounded-md p-3">
                <span :style="\`color:var(--st-\${mv.tipo==='ingreso' ? 'completado' : 'ejecucion'})\`"
                  x-html="UI.icon(mv.tipo==='ingreso' ? 'arrowUp' : 'arrowDown', 15)"></span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium" x-text="(mv.tipo==='ingreso' ? 'Ingreso' : 'Despacho') + ' de ' + mv.cantidad + ' ' + mat(kardex).unidad"></p>
                  <p class="text-xs text-ink-2" x-show="mv.actividadId"
                    x-text="mv.actividadId + ' · ' + (CALC.sitio(mv.sitioId).codigo || '')"></p>
                  <p class="mono text-xs text-ink-3 mt-0.5" x-text="\`\${UI.fmt.fecha(mv.fecha)} \${mv.hora} · \${mv.usuario}\`"></p>
                </div>
              </div>
            </template>
          </div>
          <p class="text-sm text-ink-3" x-show="!CALC.movimientosDeMaterial(kardex).length">Sin movimientos registrados para este material.</p>
        </div>
        <div class="ui-drawer-foot">
          <button class="ui-btn ui-btn-secondary ui-btn-md" @click="abrirIngreso(kardex); kardex=null" x-html="UI.icon('arrowUp',14)+' Ingreso'"></button>
          <button class="ui-btn ui-btn-primary ui-btn-md" @click="abrirDespacho(kardex); kardex=null" x-html="UI.icon('arrowDown',14)+' Despachar'"></button>
        </div>
      </aside>
    </div>
  </template>
</div>`,
};
