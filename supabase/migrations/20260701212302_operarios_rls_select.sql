-- Lectura de operarios para el equipo (panel /admin).
--
-- Causa raíz del bug "No hay operarios registrados" en
-- /admin/operaciones/[id]: la tabla `operarios` tiene RLS activada pero el rol
-- `authenticated` no tenía una policy de SELECT efectiva, así que la consulta
-- devolvía un conjunto vacío SIN error (un rechazo silencioso de RLS). La misma
-- pantalla lee `vehiculos` y `leads` con el mismo cliente autenticado y sí
-- funcionan porque esas tablas sí tienen su policy de lectura para `authenticated`.
--
-- Comprobado empíricamente (usuario autenticado real):
--   vehiculos -> 3 filas   |   operarios -> 0 filas
--
-- Esta migración deja la lectura de `operarios` al nivel del resto del panel:
-- cualquier usuario con sesión puede listarlos. Es idempotente.

alter table public.operarios enable row level security;

drop policy if exists "operarios_lectura_equipo" on public.operarios;

create policy "operarios_lectura_equipo"
  on public.operarios
  for select
  to authenticated
  using (true);
