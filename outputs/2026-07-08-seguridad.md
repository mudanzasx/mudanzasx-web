# Fase 3 — Seguridad: autorización por rol admin y anti-spam en `/api/lead`

**Fecha:** 2026-07-08
**Commit:** `95cb464` (pusheado a `main`)
**Ámbito:** cerrar los dos agujeros críticos de seguridad de la auditoría (AUDITORIA.md §6) + un ajuste menor de Stripe.
**Contexto previo:** el registro público de Supabase ya se desactivó manualmente (los usuarios no pueden auto-registrarse). Esto añade **defensa en profundidad** en el código.

> ⚠️ **ACCIÓN REQUERIDA POR TU PARTE:** el código de `requireAdmin` **ya está en producción** y es *fail-closed*. Hasta que no crees la tabla `admins` en Supabase e insertes tu `user_id` (SQL más abajo, sección (b)), **el panel te rechazará el acceso**. Ejecuta ese SQL cuanto antes para no quedarte fuera.

---

## 1. Qué se ha cambiado en el código (ya commiteado)

### Agujero 1 (CRÍTICO) — Autorización: solo se comprobaba "sesión válida", no rol admin
- **Nuevo `src/lib/auth.ts` → `requireAdmin()`**: obtiene el usuario de la sesión con `getUser()` (revalida el token contra Supabase, no se fía de la cookie) y comprueba que ese usuario está en la tabla `admins` (allowlist por `user_id`). Devuelve `user: null` cuando **no hay sesión O el usuario no es admin** (comportamiento *fail-closed*), de modo que las guardas existentes `if (!user)` de cada acción rechazan igual a un `authenticated` que no sea administrador.
- **Sustituido `requireUser`/`getUser` por `requireAdmin` en TODAS las Server Actions del panel:**
  - `src/app/admin/(panel)/leads/[id]/pagoActions.ts`
  - `src/app/admin/(panel)/leads/[id]/presupuestoActions.ts`
  - `src/app/admin/(panel)/leads/[id]/emailActions.ts`
  - `src/app/admin/(panel)/leads/[id]/actions.ts`
  - `src/app/admin/(panel)/leads/nuevo/actions.ts`
  - `src/app/admin/(panel)/operaciones/[id]/actions.ts`
- **Middleware/proxy** (`src/proxy.ts` + `src/lib/supabase/proxy.ts`): además de exigir sesión, ahora exige **rol admin** (consulta la tabla `admins`) para entrar a `/admin/*`. Si hay sesión pero no es admin → redirige a `/admin/login`. `/admin/login` sigue accesible sin sesión. También *fail-closed*: ante error de lectura o fila ausente, no se concede acceso.
- **Objetivo:** solo los usuarios de la tabla `admins` pueden acceder al panel e invocar sus acciones, aunque alguien consiguiera una sesión `authenticated` por cualquier vía.

### Agujero 2 (CRÍTICO) — `/api/lead` sin protección anti-spam
- **Rate-limiting por IP** en `src/app/api/lead/route.ts`: ventana deslizante en memoria, **máximo 5 envíos por IP cada 10 minutos**. Al superarlo responde **HTTP 429** con mensaje sobrio y **sin crear el lead**. Incluye purga de entradas caducadas para que el `Map` no crezca sin control.
  - **Aviso importante (serverless):** la memoria **no se comparte** entre instancias serverless (cada lambda tiene la suya) ni sobrevive a un *cold start*. Por eso esto es solo una **primera barrera / mitigación básica**. La protección real llegará con **Cloudflare Turnstile** + rate-limit en el edge de Cloudflare (fase posterior).
- **Hueco de Turnstile preparado** (`TODO` claramente marcado en el `POST`): punto donde se verificará el token del captcha antes de insertar (`body.turnstileToken` contra `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `TURNSTILE_SECRET_KEY`). No se implementa ahora porque requiere claves externas de Cloudflare.
- **Validación server-side de teléfono/email:** ya existía en el endpoint (`esTelefonoEsValido` / `esEmailValido`, rechazo con 400) y **se mantiene**. Teléfono = 9 dígitos empezando por 6/7/8/9; email con formato estándar.

### Ajuste menor — URLs de Stripe construidas desde el header `Host` (manipulable)
- `origen()` en `pagoActions.ts` ahora usa **`NEXT_PUBLIC_SITE_URL`** (URL de confianza) para `success_url`/`cancel_url`. El header `Host` queda solo como *fallback* en desarrollo/preview si la variable no está definida.

### Lo que NO se ha tocado
- El motor de cálculo (ya corregido en Fase 2), el diseño y el copy (fases posteriores).
- No se han escrito tests automáticos.
- `npm run build` pasa correctamente (TypeScript incluido).

---

## 2. Variable de entorno a añadir

`NEXT_PUBLIC_SITE_URL` **NO existe** actualmente en `.env.local`. **Hay que añadirla.**

El código funciona sin ella (cae al header `Host`), pero para blindar las URLs de redirección de Stripe conviene fijarla.

**En `.env.local` (local) y en Vercel (Production y Preview):**
```
NEXT_PUBLIC_SITE_URL=https://www.mudanzasx.com
```

---

## 3. SQL a ejecutar en Supabase

> La base de datos la gestionas tú por SQL. Ejecuta los bloques **en orden**. El bloque (b) es urgente (si no, te quedas sin acceso al panel). El bloque (c) endurece las tablas de datos: aplícalo **solo después** de estar tú en la tabla `admins`, o perderías acceso a los datos.

### (a) Obtener tu `user_id`
Ejecuta y copia el `id` de tu cuenta (la que usas para entrar al panel):
```sql
select id, email from auth.users order by created_at;
```

### (b) Crear la tabla `admins` + insertarte + su RLS  ← **URGENTE**
```sql
-- 1. Tabla allowlist de administradores
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text,
  created_at timestamptz not null default now()
);

-- 2. Insértate como admin.
--    OPCIÓN A: por UUID (sustituye por tu id del paso (a)):
insert into public.admins (user_id, email)
values ('TU-USER-ID-UUID-AQUI', 'dev.mudanzasx@proton.me')
on conflict (user_id) do nothing;

--    OPCIÓN B (más cómoda): por email, sin copiar el UUID a mano:
-- insert into public.admins (user_id, email)
-- select id, email from auth.users where email = 'dev.mudanzasx@proton.me'
-- on conflict (user_id) do nothing;

-- 3. RLS: cada usuario solo puede leer SU propia fila.
--    El código consulta `admins where user_id = auth.uid()`, así que con esto basta.
alter table public.admins enable row level security;

create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- NO se crean policies de insert/update/delete: la tabla se gestiona por SQL
-- (service role, que salta RLS). Así NADIE autenticado puede auto-añadirse admin.
```

> 🔒 **No crees** una policy que permita a `authenticated` hacer `INSERT` en `admins`. Si lo haces, cualquiera con sesión podría auto-nombrarse administrador. Gestiona la tabla solo por SQL / service role.

### (c) Endurecer la RLS de las tablas de datos — exigir admin en vez de cualquier `authenticated`
Actualmente las policies conceden acceso a **cualquier** usuario autenticado. Este bloque las sustituye por "solo admins". Primero un helper, luego una policy por tabla.

```sql
-- Helper: ¿el usuario actual es admin? SECURITY DEFINER para poder leer `admins`
-- sin bloquearse con la RLS de la propia tabla.
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins a where a.user_id = auth.uid()) $$;

-- Patrón por tabla. EJEMPLO para `leads`:
alter table public.leads enable row level security;

-- Borra antes las policies antiguas que daban acceso a todo `authenticated`:
-- (mira las que tienes con:  select policyname from pg_policies where tablename='leads';)
-- drop policy if exists "<nombre_policy_antigua>" on public.leads;

create policy "leads_admin_all"
  on public.leads for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());
```

**Repite EXACTAMENTE el mismo patrón** (activar RLS + borrar policies antiguas de "todo authenticated" + crear `<tabla>_admin_all`) para cada tabla del panel:
```sql
-- Por cada <tabla> en: presupuestos, pagos, operaciones, objetos, productos,
-- vehiculos, config_precios, operarios  (y cualquier otra tabla del panel):
alter table public.<tabla> enable row level security;
-- drop policy if exists "<nombre_policy_antigua>" on public.<tabla>;
create policy "<tabla>_admin_all"
  on public.<tabla> for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());
```

> ⚠️ **Cuidado con `leads`:** la tabla `leads` necesita ADEMÁS una policy de `INSERT` para el rol `anon` (el formulario público inserta con la anon key). No la cubras solo con la policy de admin: aplica también el bloque (d). La policy `leads_admin_all` es para `authenticated`; la de (d) es para `anon`. Conviven sin problema.

### (d) RLS de `anon` en `leads` — acotar lo que puede insertar el formulario público
El endpoint `/api/lead` inserta con la anon key. Se le permite **solo INSERT** (nada de leer/editar/borrar) y forzando `via_entrada = 'web'`:

```sql
-- Solo INSERT para anon, acotando el valor de via_entrada. Sin SELECT/UPDATE/DELETE.
drop policy if exists "leads_anon_insert" on public.leads;

create policy "leads_anon_insert"
  on public.leads for insert
  to anon
  with check ( via_entrada = 'web' );
```

Notas sobre (d):
- Esto **no impide** que un bot llame directo a la REST API de Supabase con la anon key (es pública); la barrera real contra flood es el rate-limit del endpoint y, en la fase siguiente, **Turnstile + Cloudflare**.
- Lo que sí consigue el `with check` es **limitar qué puede escribir `anon`**: no puede marcar un lead como `via_entrada='Manual'` ni tocar columnas sensibles (`estado_comercial`, etc.) que no sean las que fija el endpoint.
- Si la tabla `leads` tiene columnas `NOT NULL` sin `default` que el endpoint no rellena, el insert de `anon` fallará. El endpoint solo envía: `nombre, telefono, email, origen_direccion, destino_direccion, via_entrada`. Verifica que el resto de columnas tienen `default` o son *nullable*.

---

## 4. Orden de ejecución y verificación

**Orden obligatorio:**
1. **(b)** crear `admins` e insertarte a ti mismo. *(Si aplicas (c) antes de estar en `admins`, tú mismo pierdes acceso a los datos.)*
2. **(d)** policy de `anon` en `leads` (para que el formulario público siga funcionando).
3. **(c)** endurecer el resto de tablas de datos.
4. Añadir **`NEXT_PUBLIC_SITE_URL`** en `.env.local` y Vercel.

**Verificación posterior:**
- Tras (b): entra al panel → debes seguir accediendo con normalidad. Si te rechaza, revisa que tu `user_id` está en `admins` y que la policy `admins_select_own` existe.
- Tras (c): un usuario de prueba que no esté en `admins` deja de tener acceso a los datos (es lo esperado).
- Formulario público: envía un lead de prueba desde la web → debe crearse (gracias a (d)). Envía 6 veces seguidas desde la misma IP → la 6ª debe devolver **HTTP 429**.
- Stripe: genera un enlace de pago desde el panel → las URLs de éxito/cancelación deben apuntar a `https://www.mudanzasx.com` (con `NEXT_PUBLIC_SITE_URL` puesta).

---

## 5. Pendiente para fases siguientes
- **Cloudflare Turnstile**: implementar el widget en el formulario público y la verificación del token en `/api/lead` (el `TODO` ya está preparado en el código). Requiere `TURNSTILE_SECRET_KEY` (server-only) y la site key pública.
- Restringir la `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` por dominio/referrer en Google Cloud Console (ajuste operativo, no de código).
