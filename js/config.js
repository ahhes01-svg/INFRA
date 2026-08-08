/* ============================================================================
 * config.js — Conexión al backend · NettOps Perú
 *
 * La llave `anon` está pensada para vivir en el navegador: no da acceso a
 * nada por sí sola. Todo el acceso real lo gobiernan las políticas RLS y las
 * funciones de negocio definidas en supabase/01-schema.sql.
 * NUNCA pongas aquí la llave `service_role`.
 *
 * Si dejas `url` vacío, la aplicación arranca en MODO DEMO con los datos en
 * memoria de js/data.js — útil para enseñar el prototipo sin conexión.
 * ==========================================================================*/

window.CONFIG = {
  url: 'https://xcdjcdkgpkeeucdlglkb.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZGpjZGtncGtlZXVjZGxnbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDMyNTQsImV4cCI6MjEwMTc3OTI1NH0.OqSB10Fa1nIIWYwZd9e25qAbqOe8qBYBHYgIT7Pm-gg',
  bucketEvidencias: 'evidencias',

  // Fuerza el modo demo aunque haya URL (útil para presentaciones sin internet)
  forzarDemo: false,
};
