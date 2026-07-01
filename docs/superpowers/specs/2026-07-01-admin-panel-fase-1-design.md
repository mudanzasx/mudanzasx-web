# Panel interno `/admin` — Fase 1 (acceso, lista y ficha de clientes)

**Fecha:** 2026-07-01
**Estado:** Aprobado
**Alcance:** Solo acceso (login + protección), lista de leads y ficha de lead editable.
Fuera de alcance: motor de cálculo, Stripe, calendario (fases 2, 3, 4).

## Contexto técnico

- Next.js 16.2.9 (App Router), React 19, Tailwind v4, TypeScript.
- Supabase con `@supabase/supabase-js` + `@supabase/ssr` (nuevo).
- Solo hay `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sin service-role).
- RLS activo; las políticas de lectura/escritura para usuarios autenticados se gestionan
  aparte en Supabase. El código asume que una sesión válida puede leer/escribir `leads`.
- **Next 16:** la convención `middleware.ts` está deprecada y renombrada a `proxy.ts`
  (función `proxy`, runtime Node.js por defecto). Se usa `src/proxy.ts`.
- Marca: Montserrat, blanco `#FFFFFF` / negro `#000000` / gris `#F3F3F3`, sin decoración.
  `/admin` es herramienta interna: densidad y claridad tipo Linear/Notion.

## Esquema real de `leads` (nombres exactos, no renombrar)

| columna | tipo |
|---|---|
| id | uuid |
| creado_en | timestamptz |
| nombre | text |
| telefono | text |
| email | text |
| origen_direccion | text |
| origen_planta | text |
| origen_ascensor | boolean |
| destino_direccion | text |
| destino_planta | text |
| destino_ascensor | boolean |
| fecha_deseada | date |
| tamano_aprox | text |
| volumen_estimado_m3 | numeric |
| precio_aprox_min | numeric |
| precio_aprox_max | numeric |
| estado_comercial | text (default 'Nuevo') |
| via_entrada | text |
| notas | text |

Estados comerciales: `Nuevo`, `Contactado`, `Presupuesto pendiente`,
`Presupuesto enviado`, `Negociación`, `Reservado`, `Perdido`, `Cancelado`.

## Autenticación (defensa en dos capas)

- **`@supabase/ssr`** con fábricas en `src/lib/supabase/`:
  - `client.ts` — cliente de navegador (login `signInWithPassword`).
  - `server.ts` — `createServerClient` con cookies de `next/headers` (server components / actions / routes).
  - `proxy.ts` — helper que refresca sesión dentro del proxy.
- **`src/proxy.ts`** — matcher `/admin/:path*`. Sin usuario y ruta ≠ `/admin/login` → redirige a
  `/admin/login`. Con usuario en `/admin/login` → redirige a `/admin`.
- **Capa 2 (crítica):** cada página/route bajo `/admin` revalida `auth.getUser()` en el servidor
  antes de tocar datos. El proxy es UX; la página es la barrera real. Sin sesión no se consulta nada.
- **Sin signup.** Solo login. Logout = route handler `POST /admin/logout` que hace `signOut()`.

## Rutas y ficheros

```
src/proxy.ts
src/lib/supabase/{client,server,proxy}.ts
src/lib/leads.ts            # tipo Lead, ESTADOS_COMERCIALES, helpers de formato
src/app/admin/layout.tsx    # cabecera (logo-black.svg + Cerrar sesión)
src/app/admin/login/page.tsx + LoginForm (client)
src/app/admin/logout/route.ts
src/app/admin/page.tsx      # dashboard (server) + controles de búsqueda/filtro (client)
src/app/admin/leads/[id]/page.tsx  # ficha (server) + EditLeadForm (client)
src/app/admin/leads/[id]/actions.ts  # Server Action: update estado_comercial + notas
```

## Dashboard `/admin`

- Server component. `select` a `leads` orden `creado_en desc`.
- Búsqueda (`?q=`) por nombre/teléfono con `ilike`; filtro (`?estado=`) con `eq`. En servidor.
- Columnas: Nombre · Teléfono · Ruta (origen → destino, truncada) · Fecha deseada · Tamaño ·
  Estado (pastilla gris) · Fecha de entrada (`creado_en`).
- Contador total, estado vacío elegante, filas enlazan a la ficha.

## Ficha `/admin/leads/[id]`

- Muestra todos los campos agrupados: Contacto · Origen · Destino · Detalles
  (fecha, tamaño, volumen, precios si existen) · Meta (vía, creado_en).
- Editable: `estado_comercial` (select) + `notas` (textarea) → botón Guardar (Server Action,
  `update ... eq('id', id)`, revalida).
- Tres secciones etiquetadas vacías: Presupuesto, Pago, Planificación.
- Botón Volver.

## Decisiones

1. Búsqueda/filtro por query params en servidor (no cliente): simple, sin JS, datos solo del servidor.
2. Server Actions para guardar (no route `/api`): menos código, encaja con App Router.

## Verificación

- Sin tests automáticos (decisión del operador).
- `npm run build` limpio.
- Comprobar que sin sesión no se accede a ninguna ruta `/admin` ni a sus datos.
- Commit claro + push a `main`.
