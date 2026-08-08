-- ============================================================================
-- NettOps Perú — Asignar rol y técnico a las cuentas creadas
--
-- Las cuentas se crean desde: Supabase → Authentication → Users → Add user
-- (marcando "Auto Confirm User"). Este script les asigna el rol correcto y,
-- en el caso de los técnicos, los vincula con su ficha de campo.
--
-- Ejecutar DESPUÉS de crear los usuarios. Ajusta los correos a los reales.
-- ============================================================================

-- ── 1. Cuentas de gestión ───────────────────────────────────────────────────
update perfiles p set rol = 'admin', nombre = 'María Alejandra Grados', cargo = 'Jefa de Operaciones'
  from auth.users u where u.id = p.id and u.email = 'admin@nettops.pe';

update perfiles p set rol = 'supervisor', nombre = 'Carlos Bendezú Rojas', cargo = 'Supervisor de Campo'
  from auth.users u where u.id = p.id and u.email = 'supervisor@nettops.pe';

-- ── 2. Cuentas de técnicos ──────────────────────────────────────────────────
-- Vincula cada cuenta con su ficha en la tabla `tecnicos`. El técnico solo
-- verá las actividades donde figure su tecnico_id.
update perfiles p set rol = 'tecnico', nombre = 'Jorge Aparcana Donayre', tecnico_id = 'tec-03', cargo = 'Técnico electricista'
  from auth.users u where u.id = p.id and u.email = 'jorge.aparcana@nettops.pe';

update perfiles p set rol = 'tecnico', nombre = 'Rosa Quispe Huamán', tecnico_id = 'tec-01', cargo = 'Líder de cuadrilla'
  from auth.users u where u.id = p.id and u.email = 'rosa.quispe@nettops.pe';

-- Espejo en la tabla de técnicos, para saber qué ficha tiene cuenta activa
update tecnicos t set usuario_id = p.id from perfiles p where p.tecnico_id = t.id;

-- ── 3. Comprobación ─────────────────────────────────────────────────────────
select u.email, p.nombre, p.rol, p.tecnico_id, p.cargo
from perfiles p join auth.users u on u.id = p.id
order by p.rol, p.nombre;

-- ── Referencia rápida: cómo cambiar el rol de alguien más adelante ──────────
-- update perfiles p set rol = 'supervisor'
--   from auth.users u where u.id = p.id and u.email = 'quien@nettops.pe';
