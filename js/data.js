/* ============================================================================
 * data.js — Datos demo + funciones de mutación · NettOps Perú
 *
 * Todo vive en memoria. Sin base de datos, sin fetch, sin localStorage.
 * Contexto: operaciones de instalación y mantenimiento de BTS en la región
 * Ica (Ica, Pisco, Chincha, Nazca). Coordenadas GPS reales.
 *
 * El demo usa una fecha fija para conservar datos coherentes. En modo conectado
 * se calcula la fecha real de Perú, independientemente de la zona del equipo.
 * ==========================================================================*/

function fechaActualPeru() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = tipo => partes.find(p => p.type === tipo)?.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

const configFecha = window.CONFIG || {};
window.HOY = (configFecha.forzarDemo || !configFecha.url)
  ? (configFecha.fechaDemo || '2026-08-08')
  : fechaActualPeru();

window.DB = {

  sesion: {
    usuario: 'María Alejandra Grados',
    iniciales: 'MG',
    cargo: 'Jefa de Operaciones',
    // Técnico que se simula al elegir el rol "Técnico" en el navbar:
    tecnicoDemoId: 'tec-03',
  },

  /* ── Clientes ─────────────────────────────────────────────────────────── */
  clientes: [
    { id: 'cli-01', nombre: 'Claro Perú', razon: 'América Móvil Perú S.A.C.', ruc: '20467534026', contacto: 'Renzo Salaverry Díaz', cargoContacto: 'Jefe de Despliegue Región Sur', telefono: '+51 997 412 305' },
    { id: 'cli-02', nombre: 'Entel Perú', razon: 'Entel Perú S.A.', ruc: '20106897914', contacto: 'Paola Injoque Ramírez', cargoContacto: 'Coordinadora de O&M Ica', telefono: '+51 986 220 174' },
    { id: 'cli-03', nombre: 'Bitel', razon: 'Viettel Perú S.A.C.', ruc: '20543254798', contacto: 'Luis Gambetta Herrera', cargoContacto: 'Coordinador de Despliegue Nazca', telefono: '+51 945 887 660' },
  ],

  /* ── Proyectos ────────────────────────────────────────────────────────── */
  proyectos: [
    {
      id: 'pry-01', codigo: 'PRY-2026-014', clienteId: 'cli-01',
      nombre: 'Despliegue 5G NSA — Ica Metropolitana',
      descripcion: 'Instalación y comisionamiento de portadora 5G n78 sobre 5 sitios existentes en Ica, Subtanjalla, La Tinguiña, Parcona y Los Aquijes.',
      estado: 'en_ejecucion', inicio: '2026-06-15', fin: '2026-09-30',
      supervisor: 'Ing. Carlos Bendezú Rojas', presupuesto: 486500,
    },
    {
      id: 'pry-02', codigo: 'PRY-2026-021', clienteId: 'cli-02',
      nombre: 'Mantenimiento preventivo 2026 — Corredor Pisco–Chincha',
      descripcion: 'Programa anual de mantenimiento preventivo y correctivo de 8 estaciones base del corredor costero Pisco–Chincha.',
      estado: 'en_ejecucion', inicio: '2026-07-01', fin: '2026-12-15',
      supervisor: 'Ing. Carmen Falconí Espino', presupuesto: 297800,
    },
    {
      id: 'pry-03', codigo: 'PRY-2026-009', clienteId: 'cli-03',
      nombre: 'Ampliación 4G LTE — Corredor Nazca–Palpa',
      descripcion: 'Construcción e integración de 47 sitios nuevos (greenfield y cohabitación) a lo largo del corredor Nazca–Palpa–Marcona. Fase 1: surveys y adecuaciones.',
      estado: 'en_ejecucion', inicio: '2026-08-01', fin: '2027-03-31',
      supervisor: 'Ing. Carlos Bendezú Rojas', presupuesto: 3120000,
    },
  ],

  /* ── BTS / Sitios (15 con coordenadas GPS reales + 45 generados P3) ───── */
  sitios: [
    { id: 'st-01', codigo: 'IC-ICA-0201', nombre: 'Azotea Galería Fénix', direccion: 'Calle Lima 245, Cercado de Ica', distrito: 'Ica', provincia: 'Ica', lat: -14.06414, lng: -75.72951, tipo: 'Rooftop', altura: 18, tecnologias: ['2G', '4G', '5G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-01', estado: 'operativo' },
    { id: 'st-02', codigo: 'IC-SUBTANJALLA-0117', nombre: 'Fundo La Máquina', direccion: 'Panamericana Sur km 296, Subtanjalla', distrito: 'Subtanjalla', provincia: 'Ica', lat: -14.01110, lng: -75.75190, tipo: 'Greenfield', altura: 42, tecnologias: ['2G', '3G', '4G', '5G'], energia: 'Red comercial + grupo electrógeno', proyectoId: 'pry-01', estado: 'en_ejecucion' },
    { id: 'st-03', codigo: 'IC-TINGUINA-0064', nombre: 'Av. Progreso cdra. 8', direccion: 'Av. Progreso cdra. 8, La Tinguiña', distrito: 'La Tinguiña', provincia: 'Ica', lat: -14.03940, lng: -75.71484, tipo: 'Monoposte', altura: 30, tecnologias: ['3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-01', estado: 'operativo' },
    { id: 'st-04', codigo: 'IC-PARCONA-0233', nombre: 'Sector Acomayo', direccion: 'Calle Los Álamos s/n, sector Acomayo, Parcona', distrito: 'Parcona', provincia: 'Ica', lat: -14.04170, lng: -75.69310, tipo: 'Greenfield', altura: 36, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-01', estado: 'alarma' },
    { id: 'st-05', codigo: 'IC-AQUIJES-0158', nombre: 'Cruce Los Aquijes', direccion: 'Carretera Ica–Los Aquijes km 7.5', distrito: 'Los Aquijes', provincia: 'Ica', lat: -14.09670, lng: -75.68920, tipo: 'Greenfield', altura: 42, tecnologias: ['3G', '4G'], energia: 'Red comercial', proyectoId: 'pry-01', estado: 'en_ejecucion' },
    { id: 'st-06', codigo: 'IC-PISCO-0342', nombre: 'Pisco Centro', direccion: 'Av. San Martín 890, Pisco', distrito: 'Pisco', provincia: 'Pisco', lat: -13.71030, lng: -76.20320, tipo: 'Rooftop', altura: 15, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-07', codigo: 'IC-SANANDRES-0091', nombre: 'San Andrés Malecón', direccion: 'Malecón San Martín s/n, San Andrés', distrito: 'San Andrés', provincia: 'Pisco', lat: -13.74440, lng: -76.22360, tipo: 'Monoposte', altura: 24, tecnologias: ['3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-08', codigo: 'IC-TUPACAMARU-0125', nombre: 'Túpac Amaru Inca', direccion: 'Av. Fermín Tangüis cdra. 12, Túpac Amaru Inca', distrito: 'Túpac Amaru Inca', provincia: 'Pisco', lat: -13.71890, lng: -76.16280, tipo: 'Greenfield', altura: 36, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-09', codigo: 'IC-PARACAS-0288', nombre: 'El Chaco — Paracas', direccion: 'Av. Paracas s/n, El Chaco, Paracas', distrito: 'Paracas', provincia: 'Pisco', lat: -13.83390, lng: -76.25030, tipo: 'Camuflado (palmera)', altura: 21, tecnologias: ['3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-10', codigo: 'IC-CHINCHA-0412', nombre: 'Chincha Alta Centro', direccion: 'Calle Mariscal Castilla 570, Chincha Alta', distrito: 'Chincha Alta', provincia: 'Chincha', lat: -13.40990, lng: -76.13230, tipo: 'Rooftop', altura: 20, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-11', codigo: 'IC-SUNAMPE-0176', nombre: 'Sunampe Norte', direccion: 'Prolongación Av. Benavides s/n, Sunampe', distrito: 'Sunampe', provincia: 'Chincha', lat: -13.41810, lng: -76.14470, tipo: 'Monoposte', altura: 27, tecnologias: ['3G', '4G'], energia: 'Red comercial', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-12', codigo: 'IC-PUEBLONUEVO-0083', nombre: 'Pueblo Nuevo — Chincha', direccion: 'Av. Óscar R. Benavides cdra. 4, Pueblo Nuevo', distrito: 'Pueblo Nuevo', provincia: 'Chincha', lat: -13.39610, lng: -76.12810, tipo: 'Greenfield', altura: 33, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-13', codigo: 'IC-GROCIOPRADO-0147', nombre: 'Grocio Prado', direccion: 'Calle Lima s/n, cerca al Santuario Beatita de Humay, Grocio Prado', distrito: 'Grocio Prado', provincia: 'Chincha', lat: -13.39470, lng: -76.15470, tipo: 'Monoposte', altura: 24, tecnologias: ['3G', '4G'], energia: 'Red comercial', proyectoId: 'pry-02', estado: 'operativo' },
    { id: 'st-14', codigo: 'IC-NAZCA-0509', nombre: 'Nazca Centro', direccion: 'Jr. Bolognesi 371, Nazca', distrito: 'Nazca', provincia: 'Nazca', lat: -14.82800, lng: -74.93700, tipo: 'Rooftop', altura: 16, tecnologias: ['2G', '3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-03', estado: 'en_ejecucion' },
    { id: 'st-15', codigo: 'IC-VISTAALEGRE-0521', nombre: 'Vista Alegre', direccion: 'Panamericana Sur km 447, Vista Alegre, Nazca', distrito: 'Vista Alegre', provincia: 'Nazca', lat: -14.83970, lng: -74.92560, tipo: 'Greenfield', altura: 39, tecnologias: ['3G', '4G'], energia: 'Red comercial + banco 48V', proyectoId: 'pry-03', estado: 'planificado' },
  ],

  /* ── Técnicos (10) ────────────────────────────────────────────────────── */
  tecnicos: [
    { id: 'tec-01', nombre: 'Rosa Quispe Huamán', dni: '43765210', rol: 'Líder de cuadrilla', especialidad: 'RF e instalación', telefono: '+51 956 102 447', foto: 'https://i.pravatar.cc/128?img=47', estado: 'en_campo', zona: 'Ica', certificaciones: ['Trabajos en altura', 'Primeros auxilios', 'Manejo defensivo'] },
    { id: 'tec-02', nombre: 'Marco Ccahuana Flores', dni: '46882301', rol: 'Técnico RF', especialidad: 'Antenas y RRU', telefono: '+51 987 334 210', foto: 'https://i.pravatar.cc/128?img=12', estado: 'en_campo', zona: 'Ica', certificaciones: ['Trabajos en altura'] },
    { id: 'tec-03', nombre: 'Jorge Aparcana Donayre', dni: '41230976', rol: 'Técnico electricista', especialidad: 'Energía y climatización', telefono: '+51 945 771 803', foto: 'https://i.pravatar.cc/128?img=33', estado: 'en_campo', zona: 'Pisco–Chincha', certificaciones: ['Electricista industrial CONFIEP', 'Primeros auxilios'] },
    { id: 'tec-04', nombre: 'Lucía Uchuya Mesías', dni: '47119842', rol: 'Técnico de transmisión', especialidad: 'Mediciones PIM / VSWR / MW', telefono: '+51 998 450 122', foto: 'https://i.pravatar.cc/128?img=45', estado: 'disponible', zona: 'Ica', certificaciones: ['Anritsu certified', 'Trabajos en altura'] },
    { id: 'tec-05', nombre: 'César Yataco Magallanes', dni: '40587123', rol: 'Rigger / torrero', especialidad: 'Estructuras e izaje', telefono: '+51 956 889 034', foto: null, estado: 'en_campo', zona: 'Ica–Nazca', certificaciones: ['Trabajos en altura', 'Izaje y rigging nivel II'] },
    { id: 'tec-06', nombre: 'Alberto Peña Tasayco', dni: '44903218', rol: 'Técnico de energía', especialidad: 'Rectificadores y baterías', telefono: '+51 987 210 559', foto: 'https://i.pravatar.cc/128?img=60', estado: 'en_campo', zona: 'Pisco–Chincha', certificaciones: ['Electricista industrial'] },
    { id: 'tec-07', nombre: 'Milagros Huarcaya Ventura', dni: '48332075', rol: 'Técnico de comisionamiento', especialidad: 'Integración 4G/5G', telefono: '+51 944 605 918', foto: 'https://i.pravatar.cc/128?img=25', estado: 'en_campo', zona: 'Ica', certificaciones: ['Huawei HCIA-5G'] },
    { id: 'tec-08', nombre: 'Pedro Anicama Chacaliaza', dni: '42776590', rol: 'Rigger / torrero', especialidad: 'Estructuras y pintura', telefono: '+51 956 118 274', foto: null, estado: 'descanso', zona: 'Pisco–Chincha', certificaciones: ['Trabajos en altura'] },
    { id: 'tec-09', nombre: 'Katherine Ramos Cabrera', dni: '49015623', rol: 'Drive tester', especialidad: 'Medición de cobertura', telefono: '+51 999 306 481', foto: 'https://i.pravatar.cc/128?img=32', estado: 'en_campo', zona: 'Ica', certificaciones: ['TEMS Investigation', 'Manejo defensivo'] },
    { id: 'tec-10', nombre: 'Víctor Mendoza Levano', dni: '40118736', rol: 'Técnico correctivo', especialidad: 'Correctivos multi-marca', telefono: '+51 987 664 090', foto: 'https://i.pravatar.cc/128?img=14', estado: 'inactivo', zona: 'Ica', certificaciones: ['Electricista industrial'] },
  ],

  /* ── Tipos de actividad (17) ──────────────────────────────────────────── */
  tiposActividad: [
    { id: 'ta-01', nombre: 'Site survey (TSS)', categoria: 'Ingeniería', durHoras: 4 },
    { id: 'ta-02', nombre: 'Instalación de gabinete outdoor', categoria: 'Instalación', durHoras: 8 },
    { id: 'ta-03', nombre: 'Instalación de antenas RF', categoria: 'Instalación', durHoras: 8 },
    { id: 'ta-04', nombre: 'Instalación de RRU', categoria: 'Instalación', durHoras: 5 },
    { id: 'ta-05', nombre: 'Tendido de jumpers y fibra', categoria: 'Instalación', durHoras: 4 },
    { id: 'ta-06', nombre: 'Sistema de puesta a tierra', categoria: 'Instalación', durHoras: 6 },
    { id: 'ta-07', nombre: 'Comisionamiento 5G NSA', categoria: 'Comisionamiento', durHoras: 9 },
    { id: 'ta-08', nombre: 'Integración a red y pruebas', categoria: 'Comisionamiento', durHoras: 4 },
    { id: 'ta-09', nombre: 'Drive test', categoria: 'Calidad', durHoras: 6 },
    { id: 'ta-10', nombre: 'Mantenimiento preventivo', categoria: 'Mantenimiento', durHoras: 5 },
    { id: 'ta-11', nombre: 'Mantenimiento correctivo', categoria: 'Mantenimiento', durHoras: 4 },
    { id: 'ta-12', nombre: 'Medición de PIM', categoria: 'Calidad', durHoras: 3 },
    { id: 'ta-13', nombre: 'Medición de ROE / VSWR', categoria: 'Calidad', durHoras: 2.5 },
    { id: 'ta-14', nombre: 'Alineación de microondas', categoria: 'Transmisión', durHoras: 5 },
    { id: 'ta-15', nombre: 'Cambio de banco de baterías', categoria: 'Mantenimiento', durHoras: 4 },
    { id: 'ta-16', nombre: 'Adecuación estructural de torre', categoria: 'Obra civil', durHoras: 9 },
    { id: 'ta-17', nombre: 'Pintado y señalética', categoria: 'Obra civil', durHoras: 7 },
  ],

  /* ── Actividades (30) ─────────────────────────────────────────────────── */
  actividades: [
    { id: 'ACT-0001', tipoId: 'ta-01', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-01', 'tec-05'], fecha: '2026-07-27', hIni: '08:00', hFin: '12:30', inicioReal: '08:05', finReal: '12:20', estado: 'completada', checklist: [], obs: 'Acceso por trocha afirmada en buen estado. Se coordinó con el propietario del fundo el ingreso de grúa para el izaje.' },
    { id: 'ACT-0002', tipoId: 'ta-02', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-05', 'tec-06'], fecha: '2026-07-29', hIni: '07:30', hFin: '15:30', inicioReal: '07:40', finReal: '15:55', estado: 'completada', checklist: [], obs: 'Gabinete OD fijado sobre losa nueva. Pernos de anclaje M16 torqueados a 110 Nm. Acta firmada por supervisor de Claro.' },
    { id: 'ACT-0003', tipoId: 'ta-03', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-01', 'tec-02', 'tec-05'], fecha: '2026-07-31', hIni: '08:00', hFin: '16:00', inicioReal: '08:10', finReal: '16:40', estado: 'completada', checklist: [], obs: 'Sectores instalados az 40° / 160° / 280°, tilt mecánico 2°. Se reemplazó una abrazadera con hilo barrido.' },
    { id: 'ACT-0004', tipoId: 'ta-04', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-02'], fecha: '2026-08-03', hIni: '08:30', hFin: '13:30', inicioReal: '08:32', finReal: '13:10', estado: 'completada', checklist: [], obs: 'Tres RRU n78 montadas en mástil, alimentación DC verificada 53.2 V.' },
    { id: 'ACT-0005', tipoId: 'ta-05', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-02', 'tec-04'], fecha: '2026-08-04', hIni: '08:00', hFin: '12:00', inicioReal: '08:15', finReal: '11:35', estado: 'completada', checklist: [], obs: 'Jumpers 1/2" rotulados en ambos extremos. Pérdida de retorno OK en los 3 sectores.' },
    { id: 'ACT-0006', tipoId: 'ta-12', sitioId: 'st-01', proyectoId: 'pry-01', tecnicos: ['tec-04'], fecha: '2026-08-05', hIni: '09:00', hFin: '12:00', inicioReal: '09:05', finReal: '11:50', estado: 'completada', checklist: [], obs: 'PIM -153 dBc en S1 y S2. S3 en -148 dBc, dentro de umbral del cliente.' },
    { id: 'ACT-0007', tipoId: 'ta-10', sitioId: 'st-06', proyectoId: 'pry-02', tecnicos: ['tec-03', 'tec-06'], fecha: '2026-08-04', hIni: '08:00', hFin: '13:00', inicioReal: '08:02', finReal: '12:45', estado: 'completada', checklist: [], obs: 'Limpieza de filtros y ajuste de breakers. Bornes del banco con sulfatación leve, se limpiaron y engrasaron.' },
    { id: 'ACT-0008', tipoId: 'ta-10', sitioId: 'st-07', proyectoId: 'pry-02', tecnicos: ['tec-03', 'tec-06'], fecha: '2026-08-05', hIni: '08:00', hFin: '13:00', inicioReal: '08:10', finReal: '12:40', estado: 'completada', checklist: [], obs: 'Sitio con brisa marina fuerte: se reforzó protección anticorrosiva en conectores exteriores.' },
    { id: 'ACT-0009', tipoId: 'ta-13', sitioId: 'st-10', proyectoId: 'pry-02', tecnicos: ['tec-04'], fecha: '2026-08-06', hIni: '09:00', hFin: '11:30', inicioReal: '09:12', finReal: '11:25', estado: 'completada', checklist: [], obs: 'VSWR máximo 1.18 en sector 2. Sin hallazgos.' },
    { id: 'ACT-0010', tipoId: 'ta-15', sitioId: 'st-08', proyectoId: 'pry-02', tecnicos: ['tec-06'], fecha: '2026-08-06', hIni: '08:00', hFin: '12:00', inicioReal: '08:05', finReal: '11:55', estado: 'completada', checklist: [], obs: 'Banco 48V 155Ah reemplazado. Autonomía medida 4h10 tras prueba de descarga. Banco retirado quedó en almacén Pisco.' },
    { id: 'ACT-0011', tipoId: 'ta-09', sitioId: 'st-01', proyectoId: 'pry-01', tecnicos: ['tec-09'], fecha: '2026-08-07', hIni: '07:00', hFin: '13:00', inicioReal: '07:03', finReal: '13:20', estado: 'completada', checklist: [], obs: 'Ruta centro de Ica + anillo vial. RSRP promedio -84 dBm en clúster. Log entregado a optimización.' },
    // En revisión: cerrada desde campo, pendiente de aprobación del supervisor
    // (sin evidencia fotográfica: candidata natural al rechazo — caso demo)
    { id: 'ACT-0012', tipoId: 'ta-10', sitioId: 'st-11', proyectoId: 'pry-02', tecnicos: ['tec-03'], fecha: '2026-08-07', hIni: '08:00', hFin: '12:30', inicioReal: '08:20', finReal: '12:55', estado: 'en_revision', checklist: [], obs: 'Preventivo ejecutado sin evidencia fotográfica por falla de cámara del móvil; se regularizará en próxima visita.' },

    { id: 'ACT-0013', tipoId: 'ta-07', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-07', 'tec-02'], fecha: '2026-08-08', hIni: '08:00', hFin: '17:00', inicioReal: '08:12', finReal: null, estado: 'en_ejecucion', obs: 'Script de integración cargado. A la espera de ventana de RAN para activar portadora.', checklist: [
      { t: 'Verificar alimentación DC de RRU (53 V ± 1)', ok: true },
      { t: 'Cargar datafill y script de comisionamiento', ok: true },
      { t: 'Prueba de VSWR por sector', ok: true },
      { t: 'Sincronización GPS / 1588v2', ok: true },
      { t: 'Activar portadora n78 100 MHz', ok: true },
      { t: 'Prueba de tráfico con UE de prueba', ok: false },
      { t: 'KPIs iniciales dentro de umbral', ok: false },
      { t: 'Acta de comisionamiento firmada', ok: false },
    ] },
    { id: 'ACT-0014', tipoId: 'ta-10', sitioId: 'st-12', proyectoId: 'pry-02', tecnicos: ['tec-03', 'tec-06'], fecha: '2026-08-08', hIni: '08:00', hFin: '13:00', inicioReal: '08:05', finReal: null, estado: 'en_ejecucion', obs: 'Termomagnético del aire acondicionado se dispara al arranque; en revisión antes de continuar con limpieza.', checklist: [
      { t: 'Inspección visual de torre y anclajes', ok: true },
      { t: 'Medición de tierra (< 5 Ω)', ok: true },
      { t: 'Limpieza de filtros de aire acondicionado', ok: true },
      { t: 'Prueba de grupo electrógeno en carga', ok: true },
      { t: 'Revisión de banco de baterías', ok: true },
      { t: 'Ajuste y torque de conexiones DC', ok: true },
      { t: 'Verificación de alarmas remotas con NOC', ok: false },
      { t: 'Limpieza general de sala/gabinete', ok: false },
      { t: 'Rotulado y orden de cables', ok: false },
      { t: 'Registro fotográfico final', ok: false },
    ] },
    { id: 'ACT-0015', tipoId: 'ta-16', sitioId: 'st-14', proyectoId: 'pry-03', tecnicos: ['tec-05', 'tec-08'], fecha: '2026-08-08', hIni: '07:30', hFin: '16:30', inicioReal: '07:45', finReal: null, estado: 'en_ejecucion', obs: 'Refuerzo de torreta para nueva carga de antenas. Pernos con corrosión severa hallados en cara B (ver INC-2026-041).', checklist: [
      { t: 'Señalización y delimitación de área', ok: true },
      { t: 'Desmontaje de soportes obsoletos', ok: true },
      { t: 'Instalación de refuerzos verticales', ok: false },
      { t: 'Cambio de pernería observada', ok: false },
      { t: 'Torque final y verificación', ok: false },
      { t: 'Registro fotográfico', ok: false },
    ] },

    { id: 'ACT-0016', tipoId: 'ta-08', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-07'], fecha: '2026-08-08', hIni: '15:00', hFin: '19:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'Depende del comisionamiento ACT-0013. Ventana nocturna aprobada por el NOC de Claro.' },
    { id: 'ACT-0017', tipoId: 'ta-09', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-09'], fecha: '2026-08-10', hIni: '07:00', hFin: '13:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: '' },
    { id: 'ACT-0018', tipoId: 'ta-10', sitioId: 'st-13', proyectoId: 'pry-02', tecnicos: ['tec-03', 'tec-06'], fecha: '2026-08-08', hIni: '14:30', hFin: '19:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'Segunda visita del día para la cuadrilla de energía; coordinar llaves con el guardián del predio.' },
    { id: 'ACT-0019', tipoId: 'ta-12', sitioId: 'st-03', proyectoId: 'pry-01', tecnicos: ['tec-04'], fecha: '2026-08-11', hIni: '09:00', hFin: '12:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: '' },
    { id: 'ACT-0020', tipoId: 'ta-01', sitioId: 'st-18', proyectoId: 'pry-03', tecnicos: ['tec-01'], fecha: '2026-08-11', hIni: '08:00', hFin: '12:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'Coordinar acceso con municipalidad de Palpa.' },
    { id: 'ACT-0021', tipoId: 'ta-01', sitioId: 'st-19', proyectoId: 'pry-03', tecnicos: ['tec-01'], fecha: '2026-08-12', hIni: '08:00', hFin: '12:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: '' },
    { id: 'ACT-0022', tipoId: 'ta-14', sitioId: 'st-15', proyectoId: 'pry-03', tecnicos: ['tec-04'], fecha: '2026-08-12', hIni: '09:00', hFin: '14:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'Enlace VistaAlegre–Nazca Centro, alinear con nivel y RSL objetivo -38 dBm.' },
    { id: 'ACT-0023', tipoId: 'ta-17', sitioId: 'st-09', proyectoId: 'pry-02', tecnicos: ['tec-08'], fecha: '2026-08-13', hIni: '08:00', hFin: '15:00', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'SERNANP exige pintura camuflada tono palmera; usar RAL aprobado.' },

    { id: 'ACT-0024', tipoId: 'ta-11', sitioId: 'st-04', proyectoId: 'pry-01', tecnicos: ['tec-06'], fecha: '2026-08-06', hIni: '14:00', hFin: '18:00', inicioReal: null, finReal: null, estado: 'retrasada', checklist: [], obs: 'Rectificador de reemplazo aún en tránsito desde Lima (guía 004-2231). Sitio opera a baterías con autonomía limitada.' },
    { id: 'ACT-0025', tipoId: 'ta-03', sitioId: 'st-05', proyectoId: 'pry-01', tecnicos: ['tec-01', 'tec-05'], fecha: '2026-08-05', hIni: '08:00', hFin: '16:00', inicioReal: null, finReal: null, estado: 'retrasada', checklist: [], obs: 'Viento sostenido > 45 km/h en la zona; izaje suspendido por seguridad. Reprogramar con parte meteorológico favorable.' },
    { id: 'ACT-0026', tipoId: 'ta-10', sitioId: 'st-09', proyectoId: 'pry-02', tecnicos: ['tec-03'], fecha: '2026-08-07', hIni: '14:00', hFin: '17:00', inicioReal: null, finReal: null, estado: 'retrasada', checklist: [], obs: 'Cuadrilla retenida en Pueblo Nuevo por correctivo no programado.' },
    { id: 'ACT-0027', tipoId: 'ta-12', sitioId: 'st-02', proyectoId: 'pry-01', tecnicos: ['tec-04'], fecha: '2026-08-07', hIni: '14:00', hFin: '17:00', inicioReal: null, finReal: null, estado: 'retrasada', checklist: [], obs: 'Analizador PIM en calibración anual; retorna el 10/08.' },

    { id: 'ACT-0028', tipoId: 'ta-09', sitioId: 'st-14', proyectoId: 'pry-03', tecnicos: ['tec-09'], fecha: '2026-08-03', hIni: '07:00', hFin: '13:00', inicioReal: null, finReal: null, estado: 'cancelada', checklist: [], obs: 'Cliente pospuso la ventana de medición hasta integrar el segundo sitio del clúster.' },
    { id: 'ACT-0029', tipoId: 'ta-17', sitioId: 'st-13', proyectoId: 'pry-02', tecnicos: ['tec-08'], fecha: '2026-07-30', hIni: '08:00', hFin: '15:00', inicioReal: null, finReal: null, estado: 'cancelada', checklist: [], obs: 'Municipalidad observó permiso de trabajos en vía pública; se reingresó expediente.' },
    { id: 'ACT-0030', tipoId: 'ta-06', sitioId: 'st-15', proyectoId: 'pry-03', tecnicos: ['tec-06'], fecha: '2026-08-02', hIni: '08:00', hFin: '14:00', inicioReal: null, finReal: null, estado: 'cancelada', checklist: [], obs: 'Se reprogramará junto con la adecuación estructural para un solo viaje a Nazca.' },

    // Doble asignación heredada del cliente: Marco (tec-02) sigue en el
    // comisionamiento ACT-0013 hasta las 17:00 — cruce visible en el
    // timeline de cuadrillas y al intentar reprogramar.
    { id: 'ACT-0031', tipoId: 'ta-09', sitioId: 'st-03', proyectoId: 'pry-01', tecnicos: ['tec-09', 'tec-02'], fecha: '2026-08-08', hIni: '15:30', hFin: '18:30', inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: 'Ventana solicitada por el cliente con la cuadrilla ya comprometida; revisar el cruce de Marco Ccahuana con ACT-0013.' },
  ],

  /* ── Kardex de materiales (movimientos de almacén) ────────────────────── */
  movimientos: [
    { id: 'mv-08', materialId: 'MAT-002', tipo: 'despacho', cantidad: 6, fecha: '2026-08-04', hora: '07:35', actividadId: 'ACT-0005', sitioId: 'st-02', usuario: 'Almacén Ica' },
    { id: 'mv-07', materialId: 'MAT-006', tipo: 'despacho', cantidad: 1, fecha: '2026-08-06', hora: '07:20', actividadId: 'ACT-0010', sitioId: 'st-08', usuario: 'Almacén Pisco' },
    { id: 'mv-06', materialId: 'MAT-010', tipo: 'despacho', cantidad: 24, fecha: '2026-08-08', hora: '06:50', actividadId: 'ACT-0015', sitioId: 'st-14', usuario: 'Almacén Ica' },
    { id: 'mv-05', materialId: 'MAT-003', tipo: 'despacho', cantidad: 18, fecha: '2026-08-03', hora: '07:10', actividadId: 'ACT-0004', sitioId: 'st-02', usuario: 'Almacén Ica' },
    { id: 'mv-04', materialId: 'MAT-005', tipo: 'despacho', cantidad: 3, fecha: '2026-08-03', hora: '07:10', actividadId: 'ACT-0004', sitioId: 'st-02', usuario: 'Almacén Ica' },
    { id: 'mv-03', materialId: 'MAT-006', tipo: 'ingreso', cantidad: 2, fecha: '2026-08-01', hora: '10:40', actividadId: null, sitioId: null, usuario: 'Compras Lima' },
    { id: 'mv-02', materialId: 'MAT-004', tipo: 'despacho', cantidad: 3, fecha: '2026-07-31', hora: '06:45', actividadId: 'ACT-0003', sitioId: 'st-02', usuario: 'Almacén Ica' },
    { id: 'mv-01', materialId: 'MAT-001', tipo: 'ingreso', cantidad: 6, fecha: '2026-07-28', hora: '09:15', actividadId: null, sitioId: null, usuario: 'Compras Lima' },
  ],

  /* ── Incidencias (5) ──────────────────────────────────────────────────── */
  incidencias: [
    { id: 'INC-2026-038', titulo: 'Rectificador principal fuera de servicio', descripcion: 'BTS Parcona opera solo a baterías desde el 31/07. Rectificador Emerson R48-3000 no enciende, presunto daño en etapa de potencia tras corte de red comercial. Autonomía restante estimada: crítica.', severidad: 'critica', estado: 'abierta', sitioId: 'st-04', actividadId: 'ACT-0024', reportadoPor: 'tec-06', fecha: '2026-07-31', hora: '09:40', fechaLimite: '2026-08-02', asignadoA: 'tec-06' },
    { id: 'INC-2026-041', titulo: 'Corrosión severa en pernos de torreta', descripcion: 'Durante adecuación en Nazca Centro se hallaron 6 pernos de la cara B con corrosión avanzada y pérdida de sección. Se requiere cambio antes de montar nueva carga.', severidad: 'alta', estado: 'en_atencion', sitioId: 'st-14', actividadId: 'ACT-0015', reportadoPor: 'tec-05', fecha: '2026-08-06', hora: '11:15', fechaLimite: '2026-08-12', asignadoA: 'tec-05' },
    { id: 'INC-2026-042', titulo: 'Puerta de gabinete no cierra herméticamente', descripcion: 'Empaquetadura vencida en gabinete outdoor de Pisco Centro; ingreso de polvo visible en bandeja inferior. Solicitar repuesto al fabricante.', severidad: 'media', estado: 'abierta', sitioId: 'st-06', actividadId: 'ACT-0007', reportadoPor: 'tec-03', fecha: '2026-08-04', hora: '12:20', fechaLimite: '2026-08-15', asignadoA: 'tec-03' },
    { id: 'INC-2026-035', titulo: 'Alarma de puerta intermitente', descripcion: 'Sensor magnético de puerta flojo en Chincha Alta generaba alarmas falsas al NOC. Se reajustó y probó con 10 aperturas.', severidad: 'media', estado: 'resuelta', sitioId: 'st-10', actividadId: null, reportadoPor: 'tec-06', fecha: '2026-07-28', hora: '15:05', fechaLimite: '2026-08-05', asignadoA: 'tec-06', fechaResolucion: '2026-08-01' },
    { id: 'INC-2026-040', titulo: 'Malla de cerco perimetral suelta', descripcion: 'Tramo de 4 m de malla olímpica suelto en el lado norte del sitio Subtanjalla. Sin riesgo inmediato; era parte de observaciones del TSS y fue absorbida por la obra civil.', severidad: 'baja', estado: 'cancelada', sitioId: 'st-02', actividadId: 'ACT-0001', reportadoPor: 'tec-01', fecha: '2026-08-01', hora: '10:30', fechaLimite: '2026-08-20', asignadoA: 'tec-05' },
  ],

  /* ── Materiales (10) ──────────────────────────────────────────────────── */
  materiales: [
    { id: 'MAT-001', nombre: 'Cable coaxial 7/8" (rollo 50 m)', categoria: 'RF', unidad: 'rollo', stock: 12, minimo: 4, almacen: 'Almacén Ica' },
    { id: 'MAT-002', nombre: 'Jumper 1/2" × 3 m, 4.3-10 M-M', categoria: 'RF', unidad: 'und', stock: 48, minimo: 20, almacen: 'Almacén Ica' },
    { id: 'MAT-003', nombre: 'Conector 4.3-10 macho para 1/2"', categoria: 'RF', unidad: 'und', stock: 6, minimo: 24, almacen: 'Almacén Ica' },
    { id: 'MAT-004', nombre: 'Antena sectorial 4T4R 698–2690 MHz', categoria: 'RF', unidad: 'und', stock: 9, minimo: 3, almacen: 'Almacén Ica' },
    { id: 'MAT-005', nombre: 'RRU 5G n78 32T32R', categoria: 'Radio', unidad: 'und', stock: 0, minimo: 2, almacen: 'Almacén Ica' },
    { id: 'MAT-006', nombre: 'Banco de baterías 48 V 155 Ah', categoria: 'Energía', unidad: 'banco', stock: 3, minimo: 2, almacen: 'Almacén Pisco' },
    { id: 'MAT-007', nombre: 'Rectificador 48 V / 3000 W', categoria: 'Energía', unidad: 'und', stock: 0, minimo: 1, almacen: 'Almacén Ica' },
    { id: 'MAT-008', nombre: 'Kit puesta a tierra (varilla + Cadweld)', categoria: 'Obra', unidad: 'kit', stock: 15, minimo: 5, almacen: 'Almacén Ica' },
    { id: 'MAT-009', nombre: 'Pintura epóxica gris RAL 7035 (galón)', categoria: 'Obra', unidad: 'gal', stock: 2, minimo: 6, almacen: 'Almacén Pisco' },
    { id: 'MAT-010', nombre: 'Pernería M16 galvanizada + bridas', categoria: 'Obra', unidad: 'und', stock: 120, minimo: 40, almacen: 'Almacén Ica' },
  ],

  /* ── Evidencias (8, placeholders de imagen) ───────────────────────────── */
  evidencias: [
    { id: 'EV-0001', actividadId: 'ACT-0005', tipo: 'foto_antes', titulo: 'Escalerilla antes del tendido', archivo: 'https://picsum.photos/seed/nettops-ev1/640/480', fecha: '2026-08-04', hora: '08:22', subidoPor: 'tec-02', estado: 'aprobada' },
    { id: 'EV-0002', actividadId: 'ACT-0005', tipo: 'foto_despues', titulo: 'Jumpers rotulados y peinados', archivo: 'https://picsum.photos/seed/nettops-ev2/640/480', fecha: '2026-08-04', hora: '11:28', subidoPor: 'tec-02', estado: 'aprobada' },
    { id: 'EV-0003', actividadId: 'ACT-0007', tipo: 'foto_despues', titulo: 'Bornes limpios y engrasados', archivo: 'https://picsum.photos/seed/nettops-ev3/640/480', fecha: '2026-08-04', hora: '12:30', subidoPor: 'tec-03', estado: 'aprobada' },
    { id: 'EV-0004', actividadId: 'ACT-0010', tipo: 'foto_antes', titulo: 'Banco de baterías retirado', archivo: 'https://picsum.photos/seed/nettops-ev4/640/480', fecha: '2026-08-06', hora: '08:11', subidoPor: 'tec-06', estado: 'aprobada' },
    { id: 'EV-0005', actividadId: 'ACT-0010', tipo: 'foto_despues', titulo: 'Banco nuevo instalado y conectado', archivo: 'https://picsum.photos/seed/nettops-ev5/640/480', fecha: '2026-08-06', hora: '11:52', subidoPor: 'tec-06', estado: 'en_revision' },
    { id: 'EV-0006', actividadId: 'ACT-0013', tipo: 'foto_antes', titulo: 'Gabinete antes de comisionar', archivo: 'https://picsum.photos/seed/nettops-ev6/640/480', fecha: '2026-08-08', hora: '08:25', subidoPor: 'tec-07', estado: 'en_revision' },
    { id: 'EV-0007', actividadId: 'ACT-0014', tipo: 'foto_antes', titulo: 'Filtros de A/A saturados', archivo: 'https://picsum.photos/seed/nettops-ev7/640/480', fecha: '2026-08-08', hora: '08:15', subidoPor: 'tec-03', estado: 'en_revision' },
    { id: 'EV-0008', actividadId: 'ACT-0002', tipo: 'reporte', titulo: 'Acta de instalación firmada', archivo: 'https://picsum.photos/seed/nettops-ev8/640/480', fecha: '2026-07-29', hora: '15:50', subidoPor: 'tec-05', estado: 'aprobada' },
  ],

  /* ── Historial (20 registros) ─────────────────────────────────────────── */
  historial: [
    { id: 'h-20', fecha: '2026-08-08', hora: '08:25', usuario: 'Milagros Huarcaya', accion: 'evidencia_subida', entidad: 'EV-0006', detalle: 'Subió foto "Gabinete antes de comisionar" a ACT-0013 (IC-SUBTANJALLA-0117)' },
    { id: 'h-19', fecha: '2026-08-08', hora: '08:15', usuario: 'Jorge Aparcana', accion: 'evidencia_subida', entidad: 'EV-0007', detalle: 'Subió foto "Filtros de A/A saturados" a ACT-0014 (IC-PUEBLONUEVO-0083)' },
    { id: 'h-18', fecha: '2026-08-08', hora: '08:12', usuario: 'Milagros Huarcaya', accion: 'actividad_iniciada', entidad: 'ACT-0013', detalle: 'Inició Comisionamiento 5G NSA en IC-SUBTANJALLA-0117' },
    { id: 'h-17', fecha: '2026-08-08', hora: '08:05', usuario: 'Jorge Aparcana', accion: 'actividad_iniciada', entidad: 'ACT-0014', detalle: 'Inició Mantenimiento preventivo en IC-PUEBLONUEVO-0083' },
    { id: 'h-16', fecha: '2026-08-08', hora: '07:45', usuario: 'César Yataco', accion: 'actividad_iniciada', entidad: 'ACT-0015', detalle: 'Inició Adecuación estructural en IC-NAZCA-0509' },
    { id: 'h-15', fecha: '2026-08-07', hora: '17:40', usuario: 'María Alejandra Grados', accion: 'actividad_retrasada', entidad: 'ACT-0027', detalle: 'Marcó como retrasada: analizador PIM en calibración' },
    { id: 'h-14', fecha: '2026-08-07', hora: '13:20', usuario: 'Katherine Ramos', accion: 'actividad_completada', entidad: 'ACT-0011', detalle: 'Completó Drive test clúster Ica centro (6h17 de recorrido)' },
    { id: 'h-13', fecha: '2026-08-07', hora: '12:55', usuario: 'Jorge Aparcana', accion: 'actividad_completada', entidad: 'ACT-0012', detalle: 'Completó preventivo en IC-SUNAMPE-0176 sin evidencia fotográfica' },
    { id: 'h-12', fecha: '2026-08-06', hora: '18:30', usuario: 'Ing. Carmen Falconí', accion: 'actividad_retrasada', entidad: 'ACT-0026', detalle: 'Reprogramación pendiente: cuadrilla retenida en correctivo' },
    { id: 'h-11', fecha: '2026-08-06', hora: '11:55', usuario: 'Alberto Peña', accion: 'actividad_completada', entidad: 'ACT-0010', detalle: 'Completó cambio de banco de baterías en IC-TUPACAMARU-0125' },
    { id: 'h-10', fecha: '2026-08-06', hora: '11:15', usuario: 'César Yataco', accion: 'incidencia_creada', entidad: 'INC-2026-041', detalle: 'Reportó corrosión severa en pernos de torreta (IC-NAZCA-0509), severidad alta' },
    { id: 'h-09', fecha: '2026-08-05', hora: '16:20', usuario: 'Ing. Carlos Bendezú', accion: 'actividad_retrasada', entidad: 'ACT-0025', detalle: 'Izaje suspendido por viento > 45 km/h en Los Aquijes' },
    { id: 'h-08', fecha: '2026-08-05', hora: '11:50', usuario: 'Lucía Uchuya', accion: 'actividad_completada', entidad: 'ACT-0006', detalle: 'Completó medición de PIM en IC-ICA-0201' },
    { id: 'h-07', fecha: '2026-08-04', hora: '12:20', usuario: 'Jorge Aparcana', accion: 'incidencia_creada', entidad: 'INC-2026-042', detalle: 'Reportó empaquetadura vencida en gabinete de IC-PISCO-0342' },
    { id: 'h-06', fecha: '2026-08-04', hora: '11:35', usuario: 'Marco Ccahuana', accion: 'actividad_completada', entidad: 'ACT-0005', detalle: 'Completó tendido de jumpers y fibra en IC-SUBTANJALLA-0117 (3h20)' },
    { id: 'h-05', fecha: '2026-08-03', hora: '13:10', usuario: 'Marco Ccahuana', accion: 'actividad_completada', entidad: 'ACT-0004', detalle: 'Completó instalación de 3 RRU n78 en IC-SUBTANJALLA-0117' },
    { id: 'h-04', fecha: '2026-08-02', hora: '09:00', usuario: 'María Alejandra Grados', accion: 'actividad_cancelada', entidad: 'ACT-0030', detalle: 'Canceló puesta a tierra en Vista Alegre; se unificará con adecuación de torre' },
    { id: 'h-03', fecha: '2026-08-01', hora: '08:30', usuario: 'Ing. Carlos Bendezú', accion: 'proyecto_actualizado', entidad: 'PRY-2026-009', detalle: 'Arrancó fase 1 (surveys) del corredor Nazca–Palpa' },
    { id: 'h-02', fecha: '2026-07-31', hora: '09:40', usuario: 'Alberto Peña', accion: 'incidencia_creada', entidad: 'INC-2026-038', detalle: 'Reportó rectificador fuera de servicio en IC-PARCONA-0233, severidad crítica' },
    { id: 'h-01', fecha: '2026-07-29', hora: '15:55', usuario: 'César Yataco', accion: 'actividad_completada', entidad: 'ACT-0002', detalle: 'Completó instalación de gabinete outdoor en IC-SUBTANJALLA-0117' },
  ],

  /* ── Notificaciones ───────────────────────────────────────────────────── */
  notificaciones: [
    { id: 'n-00', tipo: 'pendiente', titulo: 'Cierre pendiente de aprobación', detalle: 'ACT-0012 · Preventivo en IC-SUNAMPE-0176 espera revisión del supervisor (sin evidencia fotográfica).', fecha: '2026-08-08', hora: '07:30', leida: false, link: 'actividades.html' },
    { id: 'n-01', tipo: 'critico', titulo: 'Incidencia crítica vencida hace 6 días', detalle: 'INC-2026-038 · Rectificador fuera de servicio en IC-PARCONA-0233. Límite: 02/08.', fecha: '2026-08-08', hora: '07:00', leida: false, link: 'incidencias.html' },
    { id: 'n-02', tipo: 'critico', titulo: 'Material sin stock bloquea correctivo', detalle: 'MAT-007 Rectificador 48V/3000W en 0 unidades. ACT-0024 sigue retrasada.', fecha: '2026-08-08', hora: '07:00', leida: false, link: 'materiales.html' },
    { id: 'n-03', tipo: 'pendiente', titulo: '2 evidencias esperan revisión', detalle: 'EV-0005 y EV-0006 subidas desde campo requieren aprobación del supervisor.', fecha: '2026-08-08', hora: '08:30', leida: false, link: 'evidencias.html' },
    { id: 'n-04', tipo: 'ejecucion', titulo: '3 actividades en ejecución', detalle: 'Comisionamiento 5G (Subtanjalla), preventivo (Pueblo Nuevo) y adecuación (Nazca) en curso.', fecha: '2026-08-08', hora: '08:15', leida: false, link: 'actividades.html' },
    { id: 'n-05', tipo: 'completado', titulo: 'Drive test completado', detalle: 'ACT-0011 · Clúster Ica centro, RSRP promedio -84 dBm. Log entregado.', fecha: '2026-08-07', hora: '13:25', leida: true, link: 'actividades.html' },
    { id: 'n-06', tipo: 'pendiente', titulo: 'Actividad retrasada por calibración', detalle: 'ACT-0027 · Medición PIM en Subtanjalla; analizador retorna el 10/08.', fecha: '2026-08-07', hora: '17:45', leida: true, link: 'actividades.html' },
    { id: 'n-07', tipo: 'critico', titulo: 'Nueva incidencia alta en Nazca', detalle: 'INC-2026-041 · Corrosión severa en pernos de torreta, límite 12/08.', fecha: '2026-08-06', hora: '11:20', leida: true, link: 'incidencias.html' },
    { id: 'n-08', tipo: 'completado', titulo: 'Cambio de baterías completado', detalle: 'ACT-0010 · IC-TUPACAMARU-0125, autonomía verificada 4h10.', fecha: '2026-08-06', hora: '12:00', leida: true, link: 'actividades.html' },
  ],
};

/* ── Sitios generados del proyecto Nazca (edge case: proyecto con 47 BTS) ── */
(function generarSitiosNazca() {
  const bases = [
    ['PALPA', 'Palpa', 'Palpa', -14.5336, -75.1856],
    ['ELINGENIO', 'El Ingenio', 'Nazca', -14.6367, -75.0378],
    ['CHANGUILLO', 'Changuillo', 'Nazca', -14.5764, -75.1917],
    ['LLIPATA', 'Llipata', 'Palpa', -14.5586, -75.1394],
    ['RIOGRANDE', 'Río Grande', 'Palpa', -14.5150, -75.2050],
    ['MARCONA', 'San Juan de Marcona', 'Nazca', -15.3597, -75.1636],
    ['CAHUACHI', 'Cahuachi', 'Nazca', -14.8158, -75.1181],
    ['CANTALLOC', 'Cantalloc', 'Nazca', -14.8267, -74.9089],
    ['SOISONGO', 'Soisongo', 'Nazca', -14.7900, -74.9500],
    ['ORCONA', 'Orcona', 'Nazca', -14.8050, -74.9650],
    ['SANPABLO', 'San Pablo', 'Palpa', -14.4650, -75.2150],
    ['SACRAMENTO', 'Sacramento', 'Palpa', -14.5450, -75.1700],
  ];
  const estados = ['planificado', 'planificado', 'planificado', 'en_ejecucion', 'planificado', 'operativo', 'planificado', 'planificado', 'en_ejecucion', 'planificado'];
  for (let i = 0; i < 45; i++) {
    const b = bases[i % bases.length];
    const n = Math.floor(i / bases.length) + 1;
    const num = String(530 + i).padStart(4, '0');
    // Offset determinista (~0.5–3 km) para separar sitios de una misma localidad
    const dLat = (((i * 37) % 50) - 25) / 1000;
    const dLng = (((i * 53) % 50) - 25) / 1000;
    DB.sitios.push({
      id: 'st-' + (16 + i),
      codigo: `IC-${b[0]}-${num}`,
      // Edge case: nombre de sitio muy largo
      nombre: i === 7
        ? 'Cerro San Juan Bautista de la Pampa de los Castillos — acceso por camino carrozable km 12.5 desde el desvío de la Panamericana Sur'
        : `${b[1]}${n > 1 ? ' ' + (n + 1) : ''} — km ${((i * 7) % 60) + 3}`,
      direccion: `Corredor Nazca–Palpa, sector ${b[1]}`,
      distrito: b[1], provincia: b[2],
      lat: +(b[3] + dLat).toFixed(5), lng: +(b[4] + dLng).toFixed(5),
      tipo: i % 4 === 0 ? 'Monoposte' : 'Greenfield', altura: 30 + (i % 4) * 6,
      tecnologias: ['4G'], energia: i % 3 === 0 ? 'Solar + banco 48V' : 'Red comercial',
      proyectoId: 'pry-03', estado: estados[i % estados.length],
    });
  }
})();

/* ============================================================================
 * Acceso reactivo: cuando Alpine está presente, las lecturas y mutaciones
 * pasan por Alpine.store('db') para que toda la interfaz reaccione.
 * ==========================================================================*/
function D() {
  return (window.Alpine && Alpine.store('db')) || window.DB;
}

function ahora() {
  const d = new Date();
  return { fecha: window.HOY, hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
}

function tocar() { window.dispatchEvent(new CustomEvent('app:data')); }

/* ── Cálculos derivados (nunca cifras escritas a mano) ────────────────────── */
window.CALC = {
  tipo(id) { return D().tiposActividad.find(t => t.id === id) || {}; },
  sitio(id) { return D().sitios.find(s => s.id === id) || {}; },
  proyecto(id) { return D().proyectos.find(p => p.id === id) || {}; },
  cliente(id) { return D().clientes.find(c => c.id === id) || {}; },
  tecnico(id) { return D().tecnicos.find(t => t.id === id) || {}; },
  actividad(id) { return D().actividades.find(a => a.id === id) || null; },
  incidencia(id) { return D().incidencias.find(i => i.id === id) || null; },

  avanceActividad(a) {
    if (!a) return 0;
    if (a.estado === 'completada' || a.estado === 'en_revision') return 100;
    if (a.estado === 'cancelada' || a.estado === 'pendiente') return 0;
    if (a.checklist && a.checklist.length) {
      return Math.round(a.checklist.filter(i => i.ok).length / a.checklist.length * 100);
    }
    return a.estado === 'en_ejecucion' ? 50 : 0;
  },

  /* Validación de cierre: checklist completo + foto de antes y de después */
  validarCierre(a) {
    const faltantes = [];
    if (a.checklist && a.checklist.length) {
      const sin = a.checklist.filter(i => !i.ok).length;
      if (sin) faltantes.push(`${sin} ítem(s) del checklist sin marcar`);
    }
    const evs = this.evidenciasDeActividad(a.id);
    if (!evs.some(e => e.tipo === 'foto_antes')) faltantes.push('foto de ANTES del trabajo');
    if (!evs.some(e => ['foto_despues', 'foto_avance'].includes(e.tipo))) faltantes.push('foto de DESPUÉS del trabajo');
    return { ok: !faltantes.length, faltantes };
  },
  actividadesDeSitio(sid) { return D().actividades.filter(a => a.sitioId === sid); },
  avanceSitio(sid) {
    const acts = this.actividadesDeSitio(sid).filter(a => a.estado !== 'cancelada');
    if (!acts.length) return null;
    return Math.round(acts.reduce((s, a) => s + this.avanceActividad(a), 0) / acts.length);
  },
  actividadesDeProyecto(pid) { return D().actividades.filter(a => a.proyectoId === pid); },
  avanceProyecto(pid) {
    const acts = this.actividadesDeProyecto(pid).filter(a => a.estado !== 'cancelada');
    if (!acts.length) return 0;
    return Math.round(acts.reduce((s, a) => s + this.avanceActividad(a), 0) / acts.length);
  },
  sitiosDeProyecto(pid) { return D().sitios.filter(s => s.proyectoId === pid); },
  tecnicosDeProyecto(pid) {
    const ids = new Set(this.actividadesDeProyecto(pid).flatMap(a => a.tecnicos));
    return D().tecnicos.filter(t => ids.has(t.id));
  },
  incidenciasDeProyecto(pid) {
    const sitios = new Set(this.sitiosDeProyecto(pid).map(s => s.id));
    return D().incidencias.filter(i => sitios.has(i.sitioId));
  },
  evidenciasDeActividad(aid) { return D().evidencias.filter(e => e.actividadId === aid); },
  evidenciasDeSitio(sid) {
    const acts = new Set(this.actividadesDeSitio(sid).map(a => a.id));
    return D().evidencias.filter(e => acts.has(e.actividadId));
  },
  actividadesHoy() { return D().actividades.filter(a => a.fecha === window.HOY); },
  actividadesDeTecnico(tid, fecha = null) {
    return D().actividades.filter(a => a.tecnicos.includes(tid) && (!fecha || a.fecha === fecha));
  },
  incidenciaVencida(i) {
    return (i.estado === 'abierta' || i.estado === 'en_atencion') && i.fechaLimite < window.HOY;
  },
  diasVencida(i) {
    const ms = new Date(window.HOY) - new Date(i.fechaLimite);
    return Math.max(0, Math.round(ms / 86400000));
  },
  estadoMaterial(m) {
    if (m.stock === 0) return 'sin_stock';
    if (m.stock < m.minimo) return 'stock_bajo';
    return 'disponible';
  },

  /* Cruce de horarios de un técnico (advertencia de asignación) */
  conflicto(tecId, fecha, hIni, hFin, excluirId = null) {
    return D().actividades.find(a =>
      a.id !== excluirId &&
      a.fecha === fecha &&
      !['cancelada', 'completada', 'en_revision'].includes(a.estado) &&
      a.tecnicos.includes(tecId) &&
      a.hIni < hFin && hIni < a.hFin
    ) || null;
  },

  /* Pares de actividades cruzadas de un técnico en una fecha (timeline) */
  crucesDeTecnico(tecId, fecha) {
    const acts = this.actividadesDeTecnico(tecId, fecha)
      .filter(a => !['cancelada', 'completada', 'en_revision'].includes(a.estado));
    const ids = new Set();
    for (let i = 0; i < acts.length; i++) {
      for (let j = i + 1; j < acts.length; j++) {
        if (acts[i].hIni < acts[j].hFin && acts[j].hIni < acts[i].hFin) {
          ids.add(acts[i].id); ids.add(acts[j].id);
        }
      }
    }
    return ids;
  },

  /* Kardex */
  movimientosDeMaterial(mid) { return D().movimientos.filter(m => m.materialId === mid); },
  movimientosDeSitio(sid) { return D().movimientos.filter(m => m.sitioId === sid); },

  kpis() {
    const acts = D().actividades;
    const hoy = this.actividadesHoy();
    const abiertas = D().incidencias.filter(i => ['abierta', 'en_atencion'].includes(i.estado));
    const global = Math.round(
      D().proyectos.reduce((s, p) => s + this.avanceProyecto(p.id), 0) / D().proyectos.length
    );
    return {
      actividadesHoy: hoy.length,
      enEjecucion: acts.filter(a => a.estado === 'en_ejecucion').length,
      porAprobar: acts.filter(a => a.estado === 'en_revision').length,
      completadasSemana: acts.filter(a => a.estado === 'completada' && a.fecha >= '2026-08-03').length,
      retrasadas: acts.filter(a => a.estado === 'retrasada').length,
      pendientes: acts.filter(a => a.estado === 'pendiente').length,
      incidenciasAbiertas: abiertas.length,
      incidenciasVencidas: abiertas.filter(i => this.incidenciaVencida(i)).length,
      tecnicosEnCampo: D().tecnicos.filter(t => t.estado === 'en_campo').length,
      btsAlarma: D().sitios.filter(s => s.estado === 'alarma').length,
      sitiosTotal: D().sitios.length,
      avanceGlobal: global,
      evidenciasHoy: D().evidencias.filter(e => e.fecha === window.HOY).length,
      evidenciasPorRevisar: D().evidencias.filter(e => e.estado === 'en_revision').length,
      materialesCriticos: D().materiales.filter(m => this.estadoMaterial(m) !== 'disponible').length,
      noLeidas: D().notificaciones.filter(n => !n.leida).length,
    };
  },
};

/* ── Mutaciones (cada una alimenta historial + notificaciones) ────────────── */
let _histSeq = 100;
let _notifSeq = 100;
let _incSeq = 43;
let _evSeq = 9;
let _actSeq = 32;
let _movSeq = 9;

function logHistorial(usuario, accion, entidad, detalle) {
  const t = ahora();
  D().historial.unshift({ id: 'h-' + (_histSeq++), fecha: t.fecha, hora: t.hora, usuario, accion, entidad, detalle });
}
function notificar(tipo, titulo, detalle, link = '#') {
  const t = ahora();
  D().notificaciones.unshift({ id: 'n-' + (_notifSeq++), tipo, titulo, detalle, fecha: t.fecha, hora: t.hora, leida: false, link });
}

window.ACCIONES = {
  iniciarActividad(id, usuario) {
    const a = CALC.actividad(id); if (!a || a.estado === 'en_ejecucion') return;
    const t = ahora();
    a.estado = 'en_ejecucion'; a.inicioReal = t.hora;
    const st = CALC.sitio(a.sitioId);
    logHistorial(usuario, 'actividad_iniciada', id, `Inició ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}`);
    notificar('ejecucion', 'Actividad iniciada', `${id} · ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}`, 'actividades.html');
    tocar();
  },

  toggleChecklist(id, idx, usuario) {
    const a = CALC.actividad(id); if (!a || !a.checklist[idx]) return;
    a.checklist[idx].ok = !a.checklist[idx].ok;
    if (a.checklist[idx].ok && a.checklist.every(i => i.ok)) {
      // no auto-completa: el técnico confirma con "Finalizar"
      logHistorial(usuario, 'checklist', id, `Checklist al 100% en ${id}`);
    }
    tocar();
  },

  /* Cierre desde campo: exige checklist completo + evidencia mínima.
     Si pasa, la actividad queda EN REVISIÓN esperando al supervisor. */
  finalizarActividad(id, usuario) {
    const a = CALC.actividad(id); if (!a || !['en_ejecucion', 'retrasada', 'pendiente'].includes(a.estado)) return { ok: false, faltantes: ['la actividad no está en ejecución'] };
    const v = CALC.validarCierre(a);
    if (!v.ok) return v;
    const t = ahora();
    a.estado = 'en_revision'; a.finReal = t.hora;
    if (!a.inicioReal) a.inicioReal = a.hIni;
    const st = CALC.sitio(a.sitioId);
    logHistorial(usuario, 'actividad_finalizada', id, `Cerró ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}; pasa a revisión del supervisor`);
    notificar('pendiente', 'Actividad por aprobar', `${id} · ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}`, 'actividades.html');
    tocar();
    return { ok: true };
  },

  aprobarActividad(id, usuario) {
    const a = CALC.actividad(id); if (!a || a.estado !== 'en_revision') return;
    a.estado = 'completada';
    const st = CALC.sitio(a.sitioId);
    const pry = CALC.proyecto(a.proyectoId);
    logHistorial(usuario, 'actividad_aprobada', id, `Aprobó ${id} en ${st.codigo} — avance de ${pry.codigo} recalculado a ${CALC.avanceProyecto(a.proyectoId)}%`);
    notificar('completado', 'Actividad aprobada', `${id} · ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}`, 'actividades.html');
    tocar();
  },

  rechazarActividad(id, motivo, usuario) {
    const a = CALC.actividad(id); if (!a || a.estado !== 'en_revision') return;
    a.estado = 'en_ejecucion'; a.finReal = null;
    a.obs = (a.obs ? a.obs + ' · ' : '') + `RECHAZO del supervisor: ${motivo || 'sin motivo indicado'}`;
    const st = CALC.sitio(a.sitioId);
    logHistorial(usuario, 'actividad_rechazada', id, `Rechazó el cierre de ${id} (${st.codigo}): ${motivo || 'sin motivo'}`);
    notificar('critico', 'Cierre rechazado', `${id} · ${motivo || 'revisar observaciones'}`, 'actividades.html');
    tocar();
  },

  /* Aprobación directa (atajo del administrador en el control diario) */
  completarActividad(id, usuario) {
    const a = CALC.actividad(id); if (!a || a.estado === 'completada') return;
    const t = ahora();
    a.estado = 'completada'; a.finReal = a.finReal || t.hora;
    if (!a.inicioReal) a.inicioReal = a.hIni;
    if (a.checklist) a.checklist.forEach(i => i.ok = true);
    const st = CALC.sitio(a.sitioId);
    const pry = CALC.proyecto(a.proyectoId);
    logHistorial(usuario, 'actividad_completada', id, `Completó ${CALC.tipo(a.tipoId).nombre} en ${st.codigo} — avance de ${pry.codigo} recalculado a ${CALC.avanceProyecto(a.proyectoId)}%`);
    notificar('completado', 'Actividad completada', `${id} · ${CALC.tipo(a.tipoId).nombre} en ${st.codigo}`, 'actividades.html');
    tocar();
  },

  /* Kardex: despacho descuenta stock y queda ligado a actividad/sitio */
  despacharMaterial(materialId, cantidad, actividadId, usuario) {
    const m = D().materiales.find(x => x.id === materialId); if (!m) return { ok: false, error: 'material no encontrado' };
    cantidad = Math.max(1, Math.round(Number(cantidad) || 0));
    if (cantidad > m.stock) return { ok: false, error: `stock insuficiente: quedan ${m.stock} ${m.unidad}` };
    const a = CALC.actividad(actividadId);
    const t = ahora();
    m.stock -= cantidad;
    D().movimientos.unshift({ id: 'mv-' + String(_movSeq++).padStart(2, '0'), materialId, tipo: 'despacho', cantidad, fecha: t.fecha, hora: t.hora, actividadId: a ? a.id : null, sitioId: a ? a.sitioId : null, usuario });
    const destino = a ? `${a.id} (${CALC.sitio(a.sitioId).codigo})` : 'sin actividad';
    logHistorial(usuario, 'material_despachado', materialId, `Despachó ${cantidad} ${m.unidad} de ${m.nombre} a ${destino}`);
    if (m.stock === 0) notificar('critico', 'Material agotado', `${materialId} · ${m.nombre} quedó en cero tras el despacho.`, 'materiales.html');
    else if (m.stock < m.minimo) notificar('pendiente', 'Material bajo mínimo', `${materialId} · quedan ${m.stock} ${m.unidad} (mínimo ${m.minimo}).`, 'materiales.html');
    tocar();
    return { ok: true };
  },

  ingresarMaterial(materialId, cantidad, usuario) {
    const m = D().materiales.find(x => x.id === materialId); if (!m) return { ok: false };
    cantidad = Math.max(1, Math.round(Number(cantidad) || 0));
    const t = ahora();
    m.stock += cantidad;
    D().movimientos.unshift({ id: 'mv-' + String(_movSeq++).padStart(2, '0'), materialId, tipo: 'ingreso', cantidad, fecha: t.fecha, hora: t.hora, actividadId: null, sitioId: null, usuario });
    logHistorial(usuario, 'material_ingresado', materialId, `Ingresó ${cantidad} ${m.unidad} de ${m.nombre} al almacén`);
    tocar();
    return { ok: true };
  },

  cancelarActividad(id, motivo, usuario) {
    const a = CALC.actividad(id); if (!a) return;
    a.estado = 'cancelada';
    if (motivo) a.obs = (a.obs ? a.obs + ' · ' : '') + 'Cancelada: ' + motivo;
    logHistorial(usuario, 'actividad_cancelada', id, `Canceló ${id}${motivo ? ': ' + motivo : ''}`);
    tocar();
  },

  crearActividad({ tipoId, sitioId, proyectoId, tecnicos, fecha, hIni, hFin, obs }, usuario) {
    // Advertencia de cruce: rechaza si algún técnico ya está ocupado
    for (const tid of tecnicos) {
      const c = CALC.conflicto(tid, fecha, hIni, hFin);
      if (c) return { ok: false, conflicto: c, tecnico: CALC.tecnico(tid) };
    }
    const id = 'ACT-' + String(_actSeq++).padStart(4, '0');
    D().actividades.push({ id, tipoId, sitioId, proyectoId, tecnicos, fecha, hIni, hFin, inicioReal: null, finReal: null, estado: 'pendiente', checklist: [], obs: obs || '' });
    logHistorial(usuario, 'actividad_creada', id, `Programó ${CALC.tipo(tipoId).nombre} en ${CALC.sitio(sitioId).codigo} para el ${fecha}`);
    tocar();
    return { ok: true, id };
  },

  reprogramarActividad(id, fecha, hIni, hFin, usuario) {
    const a = CALC.actividad(id); if (!a) return { ok: false };
    for (const tid of a.tecnicos) {
      const c = CALC.conflicto(tid, fecha, hIni, hFin, id);
      if (c) return { ok: false, conflicto: c, tecnico: CALC.tecnico(tid) };
    }
    a.fecha = fecha; a.hIni = hIni; a.hFin = hFin;
    if (a.estado === 'retrasada') a.estado = 'pendiente';
    logHistorial(usuario, 'actividad_reprogramada', id, `Reprogramó ${id} al ${fecha} ${hIni}–${hFin}`);
    tocar();
    return { ok: true };
  },

  crearIncidencia({ titulo, descripcion, severidad, sitioId, actividadId, fechaLimite }, usuario, reportadoPorId) {
    const t = ahora();
    const id = 'INC-2026-0' + (_incSeq++);
    D().incidencias.unshift({ id, titulo, descripcion, severidad, estado: 'abierta', sitioId, actividadId: actividadId || null, reportadoPor: reportadoPorId, fecha: t.fecha, hora: t.hora, fechaLimite, asignadoA: reportadoPorId });
    if (severidad === 'critica') { const s = CALC.sitio(sitioId); if (s) s.estado = 'alarma'; }
    logHistorial(usuario, 'incidencia_creada', id, `Reportó "${titulo}" en ${CALC.sitio(sitioId).codigo}, severidad ${severidad}`);
    notificar(severidad === 'critica' ? 'critico' : 'pendiente', `Nueva incidencia ${severidad}`, `${id} · ${titulo} (${CALC.sitio(sitioId).codigo})`, 'incidencias.html');
    tocar();
    return id;
  },

  atenderIncidencia(id, usuario) {
    const i = CALC.incidencia(id); if (!i) return;
    i.estado = 'en_atencion';
    logHistorial(usuario, 'incidencia_actualizada', id, `Pasó ${id} a "en atención"`);
    tocar();
  },

  resolverIncidencia(id, usuario) {
    const i = CALC.incidencia(id); if (!i) return;
    i.estado = 'resuelta'; i.fechaResolucion = window.HOY;
    const s = CALC.sitio(i.sitioId);
    if (s && s.estado === 'alarma' && !D().incidencias.some(x => x.sitioId === s.id && x.severidad === 'critica' && ['abierta', 'en_atencion'].includes(x.estado) && x.id !== id)) {
      s.estado = 'operativo';
    }
    logHistorial(usuario, 'incidencia_resuelta', id, `Resolvió ${id} — ${i.titulo}`);
    notificar('completado', 'Incidencia resuelta', `${id} · ${i.titulo}`, 'incidencias.html');
    tocar();
  },

  subirEvidencia(actividadId, tipo, titulo, usuario, tecnicoId) {
    const t = ahora();
    const id = 'EV-' + String(_evSeq++).padStart(4, '0');
    D().evidencias.unshift({ id, actividadId, tipo, titulo: titulo || 'Evidencia de campo', archivo: `https://picsum.photos/seed/nettops-${id}/640/480`, fecha: t.fecha, hora: t.hora, subidoPor: tecnicoId, estado: 'en_revision' });
    logHistorial(usuario, 'evidencia_subida', id, `Subió evidencia "${titulo || 'Evidencia de campo'}" a ${actividadId}`);
    notificar('pendiente', 'Evidencia por revisar', `${id} · ${actividadId}`, 'evidencias.html');
    tocar();
    return id;
  },

  aprobarEvidencia(id, usuario) {
    const e = D().evidencias.find(x => x.id === id); if (!e) return;
    e.estado = 'aprobada';
    logHistorial(usuario, 'evidencia_aprobada', id, `Aprobó evidencia ${id} de ${e.actividadId}`);
    tocar();
  },

  marcarLeida(id) {
    const n = D().notificaciones.find(x => x.id === id); if (n) n.leida = true;
    tocar();
  },
  marcarTodasLeidas() {
    D().notificaciones.forEach(n => n.leida = true);
    tocar();
  },
};
