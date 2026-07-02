-- Alta manual de leads desde el panel (/admin/leads/nuevo).
--
-- El formulario web inserta en `leads` con el cliente ANÓNIMO (rol `anon`), por
-- lo que existe una policy de INSERT para ese rol. El alta manual del panel usa
-- el cliente AUTENTICADO (rol `authenticated`); si solo hubiera una policy de
-- INSERT para `anon`, el insert del panel sería rechazado por RLS (rechazo
-- silencioso salvo el error que devuelve la Server Action `crearLead`).
--
-- Esta migración concede el INSERT a cualquier usuario con sesión, al mismo
-- nivel que el resto del panel (ver `operarios_lectura_equipo`). Es idempotente:
-- si el permiso ya existía por otra policy equivalente, aplicarla no cambia el
-- comportamiento.

alter table public.leads enable row level security;

drop policy if exists "leads_insert_panel" on public.leads;

create policy "leads_insert_panel"
  on public.leads
  for insert
  to authenticated
  with check (true);
