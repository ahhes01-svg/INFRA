-- ============================================================================
-- NettOps Perú — Asignar rol y técnico a las cuentas creadas
--
-- Las cuentas se crean desde: Supabase → Authentication → Users → Add user
-- (marcando "Auto Confirm User"). Este script les asigna el rol correcto y,
-- en el caso de los técnicos, los vincula con su ficha de campo.
--
-- Ejecutar DESPUÉS de crear los usuarios. Es idempotente.
-- ============================================================================

-- ── 1. Cuentas de gestión ───────────────────────────────────────────────────
update perfiles p set rol = 'admin', nombre = 'María Alejandra Grados', cargo = 'Jefa de Operaciones'
  from auth.users u where u.id = p.id and u.email = 'admin@bitel.com.pe';

update perfiles p set rol = 'supervisor', nombre = 'Carlos Bendezú Rojas', cargo = 'Supervisor de Campo'
  from auth.users u where u.id = p.id and u.email = 'supervisor@bitel.com.pe';

-- ── 2. Cuentas de técnicos ──────────────────────────────────────────────────
-- Vincula cada cuenta con su ficha en la tabla `tecnicos`. El técnico solo
-- verá las actividades donde figure su tecnico_id.
update perfiles p set rol = 'tecnico', nombre = 'Jorge Aparcana Donayre', tecnico_id = 'tec-03', cargo = 'Técnico electricista'
  from auth.users u where u.id = p.id and u.email = 'jorge.aparcana@nettops.pe';

-- Espejo en la tabla de técnicos, para saber qué ficha tiene cuenta activa
update tecnicos t set usuario_id = p.id from perfiles p where p.tecnico_id = t.id;

-- ── 3. Comprobación ─────────────────────────────────────────────────────────
-- Deben salir las 3 cuentas con su rol. Si alguna aparece como 'tecnico' sin
-- tecnico_id, revisa que el correo coincida exactamente con el de Authentication.
select u.email, p.nombre, p.rol, p.tecnico_id, p.cargo
from perfiles p join auth.users u on u.id = p.id
order by p.rol, p.nombre;

-- ── Referencia rápida ───────────────────────────────────────────────────────
-- Cambiar el rol de alguien más adelante:
--   update perfiles p set rol = 'supervisor'
--     from auth.users u where u.id = p.id and u.email = 'quien@bitel.com.pe';
--
-- Dar de alta un técnico nuevo (primero crea su cuenta en Authentication):
--   update perfiles p set rol = 'tecnico', tecnico_id = 'tec-05', nombre = 'César Yataco Magallanes'
--     from auth.users u where u.id = p.id and u.email = 'cesar.yataco@nettops.pe';
--   update tecnicos t set usuario_id = p.id from perfiles p where p.tecnico_id = t.id;
