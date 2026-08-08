# Publicación mínima de NettOps

La arquitectura operativa es deliberadamente pequeña: archivos estáticos en un
hosting HTTPS y un proyecto Supabase. No requiere servidor propio, contenedores
ni microservicios.

## 1. Separar demo y producción

- Producción debe tener `url`, `anonKey` y `forzarDemo: false` en `js/config.js`.
- Demo puede usar un proyecto separado o `forzarDemo: true`.
- Un fallo de red en producción muestra un error; nunca debe activar datos demo.
- No uses datos, fotografías ni cuentas reales en el entorno demo.

## 2. Preparar Supabase

Ejecuta en SQL Editor, conservando exactamente este orden:

1. `supabase/01-schema.sql`
2. `supabase/05-gestion.sql`
3. `supabase/02-seed.sql` solamente en demo o pruebas
4. `supabase/03-storage.sql`
5. Crea las cuentas necesarias en Authentication
6. `supabase/04-usuarios.sql`, después de adaptar sus correos

En Authentication desactiva el registro público. Las cuentas productivas se
crean desde el panel de Supabase y luego se vinculan a un técnico. Mantén
`permitirAltaDesdeApp: false` mientras no exista una función administrativa de
servidor para crear usuarios.

## 3. Verificaciones antes de publicar

- Una cuenta no autenticada no puede ejecutar funciones RPC.
- Un técnico sin vínculo no puede cargar catálogos ni datos operativos.
- Un técnico vinculado solo ve sus actividades, checklist y evidencias.
- Un supervisor puede programar y aprobar, pero no otorgar roles de gestión.
- Un administrador puede gestionar cuentas y catálogos.
- Una URL de evidencia expira y no funciona como enlace público permanente.
- Una caída de Supabase mantiene la aplicación bloqueada, sin entrar en demo.

## 4. Hosting

Publica la carpeta como sitio estático con HTTPS. Configura encabezados mínimos:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(self)`
- `Strict-Transport-Security` cuando el dominio opere exclusivamente con HTTPS

Las dependencias todavía se cargan desde CDN. Antes de endurecer una política
CSP estricta conviene empaquetarlas localmente en una etapa posterior.

## 5. Respaldo y reversión

- Activa los respaldos disponibles para el proyecto Supabase.
- Guarda una exportación antes de aplicar cambios SQL en producción.
- Publica versiones inmutables del frontend y conserva la versión anterior.
- Si falla el frontend, revierte el artefacto estático; no borres ni reinicies la
  base de datos para corregir un problema visual.
