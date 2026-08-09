# NettOps Perú — Gestión de operaciones BTS

Sistema de gestión de proyectos de telecomunicaciones (instalación y
mantenimiento de estaciones base) para una empresa de operaciones técnicas de
campo en Perú. Contexto real: sitios con coordenadas GPS de Ica, Pisco,
Chincha y Nazca, nomenclatura de operador (`IC-PISCO-0342`), técnicos con
nombres peruanos y observaciones escritas como en campo.

Funciona en dos modos:

- **Modo demo** — sin servidor, datos en memoria. Ideal para enseñarlo sin
  conexión. Se activa solo si no hay backend configurado, o poniendo
  `forzarDemo: true` en `js/config.js`.
- **Modo conectado** — Supabase (Postgres + autenticación + almacenamiento de
  fotos). Cuentas reales, roles con permisos aplicados en el servidor,
  evidencia fotográfica con GPS y hora.

## Cómo ejecutarlo

No hay build ni npm. Solo archivos estáticos:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

En modo demo, cualquier usuario y una contraseña de 6+ caracteres sirven, y el
rol se elige en el formulario. En modo conectado se entra con la cuenta real y
el rol lo determina el perfil del usuario.

## Puesta en marcha del backend

Los scripts están en `supabase/`, en orden. Se ejecutan en
**Supabase → SQL Editor → New query → pegar → Run**:

| Archivo | Qué hace | Cuándo |
|---|---|---|
| `01-schema.sql` | Tablas, índices, RLS, funciones de negocio | Una vez |
| `02-seed.sql` | Datos demo peruanos | Una vez (opcional) |
| `03-storage.sql` | Bucket `evidencias` y sus políticas | Una vez |
| `04-usuarios.sql` | Asigna rol y técnico a cada cuenta | Tras crear usuarios |

Los cuatro son **idempotentes**: pueden re-ejecutarse sin duplicar datos.

Luego, en `js/config.js`, pon la URL del proyecto y la llave `anon`. Esa llave
está diseñada para vivir en el navegador; el acceso real lo gobiernan las
políticas RLS. **Nunca pongas ahí la llave `service_role`.**

### Dónde vive cada regla

Las reglas críticas están en Postgres, no en el navegador, para que no puedan
saltarse manipulando el JavaScript:

- Cerrar una actividad exige checklist completo y fotos de antes/después.
- Solo un supervisor o administrador aprueba o rechaza un cierre.
- Un técnico solo ve y toca las actividades de su cuadrilla.
- Un despacho de material no puede dejar el stock en negativo.
- No se puede programar a un técnico con el horario cruzado.

## Stack

- **HTML + Tailwind CSS (CDN) + Alpine.js (CDN)** — sin compilación
- **Supabase** (Postgres, Auth, Storage) — backend sin servidor propio
- **Chart.js** (gráficos), **FullCalendar** (agenda), **Leaflet** (mapas)

## Arquitectura

Es una **aplicación de una sola página con carga bajo demanda**, sin paso de
compilación para desplegar. Cada sección vive en su propio módulo y se descarga
la primera vez que se visita; al cambiar de sección no se recarga el documento.

```
index.html          login
app.html            contenedor único de la aplicación
css/tailwind.css    hoja compilada (17 KB) — ver build/README.md
js/core/app.js      arranque: sesión, marco, Alpine, enrutador
js/core/router.js   rutas #/… con import() dinámico por sección
js/core/deps.js     Chart, FullCalendar y Leaflet solo cuando hacen falta
js/core/shell.js    barra lateral, cabecera, campana y avisos (se monta una vez)
js/core/calc.js     almacén en memoria y cálculos derivados
js/views/*.js       una sección por módulo (18 vistas)
js/demo/datos.js    conjunto de demostración (solo si no hay backend)
js/api.js           cliente Supabase: sesión, carga y mutaciones
js/components.js    componentes reutilizables (CSS + ayudantes + Alpine)
js/tokens.js        tokens de diseño
pages/design-system.html   catálogo de componentes
supabase/*.sql      esquema, datos, almacenamiento, usuarios y gestión
build/              configuración para regenerar la hoja de estilos
```

### Qué se carga y cuándo

| Momento | Se descarga |
|---|---|
| Primera carga | Marco, estilos, Alpine, cliente Supabase y la sección de entrada |
| Cambiar de sección | Solo el módulo de esa sección (4–26 KB) |
| Entrar a Dashboard o Reportes | Chart.js, una vez por sesión |
| Entrar a BTS | Leaflet, una vez por sesión |
| Entrar a Agenda | FullCalendar, una vez por sesión |
| Sin backend | El conjunto de demostración (50 KB) |

Con el navegador ocioso se adelantan en segundo plano las secciones más
visitadas, de modo que el primer clic ya las encuentra en memoria.

### Por qué así y no con un framework compilado

Vue o React habrían obligado a reescribir las 18 vistas y a compilar antes de
cada despliegue. Los módulos nativos con `import()` dinámico dan la misma carga
diferida conservando el despliegue de un solo `git push`, y las vistas siguen
siendo el mismo marcado que ya estaba probado.

`js/api.js` conserva la misma superficie que la capa en memoria (`DB`, `CALC`,
`ACCIONES`), por eso conectar el backend no obligó a reescribir ningún módulo.

## Qué probar

- **Búsqueda global**: `Ctrl+K` (o el botón "Buscar…" del navbar) desde
  cualquier pantalla — salta a sitios, actividades, técnicos, proyectos,
  incidencias y materiales con navegación por teclado.
- **Kanban de actividades** (Actividades → Kanban): arrastra tarjetas por el
  flujo Pendiente → En ejecución → En revisión → Completada; los movimientos
  ilegales se rechazan con aviso.
- **Cierre validado + aprobación**: no se puede Finalizar sin checklist
  completo y fotos de antes/después; el cierre queda "En revisión" y el
  supervisor lo aprueba o lo rechaza con motivo (Supervisión → "Cierres por
  aprobar"; prueba rechazar ACT-0012, que llegó sin fotos).
- **Timeline de cuadrillas** (Agenda → Cuadrillas): filas por técnico, de
  06:00 a 20:00; los bloques con borde rojo punteado se cruzan (Marco y
  Milagros lo demuestran el sábado 08).
- **Mapa completo** (BTS/Sitios → Mapa completo): clúster de 60 sitios,
  filtros por estado/proyecto y ruta del día de un técnico numerada.
- **Kardex conectado** (Materiales → clic derecho en una fila): despachar
  descuenta stock, alimenta el kardex y aparece en la ficha del sitio.

- **Reactividad en memoria**: completa una actividad desde el Dashboard o el
  drawer de Actividades — sube el avance del BTS y del proyecto, las cifras
  del dashboard cuentan al nuevo valor, los gráficos se redibujan y el
  historial y la campana registran el evento.
- **Checklist en vivo** (Actividades → abrir `ACT-0013` o `ACT-0014`): cada
  ítem marcado anima la barra de porcentaje.
- **Cruce de horarios** (Agenda): arrastra `ACT-0018` (14:30) sobre la mañana
  del sábado — se rechaza con sacudida y toast porque la cuadrilla ya está en
  `ACT-0014`. El formulario "Programar" avisa del cruce en vivo.
- **Rol Técnico → Mi jornada**: vista móvil con botones grandes; Iniciar →
  Registrar avance → Subir evidencia (dos toques) → Registrar incidencia →
  Finalizar.
- **Estados de pantalla**: el conmutador Datos / Carga / Vacío / Error del
  navbar muestra los cuatro estados de cada módulo (skeletons con la forma
  del contenido, vacíos accionables, errores con reintento).
- **Modo oscuro**: pensado para uso nocturno en campo, sin negros puros.
- **Casos de borde**: proyecto con 47 BTS (PRY-2026-009, con paginación),
  nombre de sitio kilométrico, técnicos sin foto, incidencia crítica vencida
  hace 6 días (INC-2026-038), actividad completada sin evidencias, material
  sin stock que bloquea un correctivo.

## Fuera de alcance (a propósito)

Base de datos, autenticación real, subida real de archivos y exportación a
PDF/Excel. Esos botones existen y avisan "no disponible en el prototipo".
