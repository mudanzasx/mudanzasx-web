# TODO — Auditoría 2 Mudanzas X

> Fuente: `outputs/2026-07-15-auditoria-2.md`. Cada tarea es autoexplicativa (qué · dónde · nota).
> IDs estables: **C** críticos · **I** importantes · **M** menores · **B** ideas de negocio.

## Resumen

- **Recuento real (desglose completo):** 1 crítico · **13 importantes** · **38 menores** = 52 tareas, + 7 ideas de negocio + limpieza de archivos.
  (Amplía las cifras aproximadas del resumen ejecutivo del informe "~11/~28"; aquí están todos los hallazgos, incluidos los menores.)
- **Motor, Seguridad y SEO pasaron las comprobaciones de fondo — sin tareas críticas ahí:**
  - Motor: F1/F2/F3 intactos y correctos.
  - Seguridad: `requireAdmin` en actions y middleware, webhook firmado, Turnstile server-side, service_role server-only, `.env.local` no trackeado.
  - SEO: el `FAQPage` JSON-LD coincide 100% con las FAQs reales.
  - Las tareas de esas áreas son solo **menores de higiene / defensa en profundidad**.
- Trabajar por fases: primero 🔴, luego 🟠 (por impacto), luego 🟡. Al completar, mover a **✅ HECHO** con fecha.

---

## 🔴 CRÍTICOS

### Copy
_C1 completada (2026-07-15) → ✅ HECHO. Sin tareas críticas pendientes._

---

## 🟠 IMPORTANTES

### UX / Operativa
_I5 completada (2026-07-15) → ✅ HECHO. Sin importantes de UX/Operativa pendientes._

### Copy
_I6 completada (2026-07-15) → ✅ HECHO._

### Rendimiento
_I7 e I8 completadas (2026-07-15) → ✅ HECHO._

### SEO
_I9 completada (2026-07-17) → ✅ HECHO._

### Marca / Diseño
_I10, I11 e I12 completadas (2026-07-17) → ✅ HECHO._

### Limpieza / Refactor
_I13 completada (2026-07-17) → ✅ HECHO._

**No quedan tareas importantes pendientes.**

---

## 🟡 MENORES

### Marca / Diseño
_M1, M2, M3 y M4 completadas (2026-07-20) → ✅ HECHO._

### UX
_M5, M6, M8, M9, M10, M11, M12, M13 y M14 completadas (2026-07-21) → ✅ HECHO._
- [ ] **M7** — Sincronizar `--fixed-top` con la altura real que mide el scrollspy. `globals.css:63-69`, `Header.tsx:52`.

### Copy
_M15, M16, M17, M18 y M19 completadas (2026-07-21) → ✅ HECHO._

### SEO
_M20, M21, M22 y M23 completadas (2026-07-20) → ✅ HECHO._

### Rendimiento
- [ ] **M24** — (Opcional) Renderizar solo la imagen de servicio activa (+ prefetch de la siguiente) en vez de las 4 capas. `Servicios.tsx:74-91`.
- [ ] **M25** — Quitar `priority` de los logos del header (el LCP es el hero). `Header.tsx:131-148`.
_M26 completada (2026-07-17) → ✅ HECHO (resuelta al eliminar la imagen con I9)._
- [ ] **M27** — (Opcional) Usar `<Image unoptimized>` para los logos del panel (coherencia/lint). `admin/login/page.tsx:29`, `admin/(panel)/layout.tsx:30,32`.

### Motor (higiene — sin impacto en cifras de cliente)
- [ ] **M28** — Persistir `cargo_punto_limpio` como columna para que el desglose reconstruya `precio_final`. `presupuestoActions.ts:416-432`.
- [ ] **M29** — Guardar `duracion_total_h` en vez de `horas` (que mezcla horas-persona y horas-reloj). `presupuesto.ts:267-272`, `presupuestoActions.ts:423`.

### Seguridad (defensa en profundidad — no explotable hoy)
- [ ] **M30** — Usar `requireAdmin()` también en el layout del panel (hoy solo comprueba sesión). `admin/(panel)/layout.tsx:13-20`.
- [ ] **M31** — Rate-limit de `/api/lead` en store compartido (Upstash/KV) o WAF de Cloudflare. `api/lead/route.ts:24-26`.
- [ ] **M32** — Exigir `NEXT_PUBLIC_SITE_URL` en producción en vez de caer al header `Host`. `pagoActions.ts:52-55`.
- [ ] **M33** — Deduplicar el webhook de Stripe por `event.id`. `stripe/webhook/route.ts:54-67`.

### Limpieza
_M34, M35, M36, M37 y M38 completadas (2026-07-20) → ✅ HECHO._

---

## 🧹 LIMPIEZA — archivos / exports a eliminar

- [x] **`public/servicios.webp`** — eliminada (2026-07-20). Huérfana, 0 referencias, ~51 KB (resto de la versión anterior de Servicios).
- [ ] Eliminar export `TELEFONO_DISPLAY` — `config.ts:9`. *(= M34.)*
- [ ] Eliminar type `ConsentCategory` — `consent.ts:10`. *(= M35.)*
- [ ] Quitar `export` de `CONSENT_STORAGE_KEY` — `consent.ts:27`. *(= M36.)*
- [x] **`public/embalaje-cuidado-mueble.jpg`** — eliminada (2026-07-17). El `image` del JSON-LD ya apunta a `servicio-transporte.webp` (I9), así que la imagen quedó huérfana y se borró del disco. Precaución resuelta.

---

## 💡 IDEAS DE NEGOCIO

Priorizadas por impacto/esfuerzo (mayor a menor).

_B1 completada (2026-07-15) → ✅ HECHO (misma entrega que I1)._
- [ ] **B2** — [MEDIO-ALTO / BAJO] Email de acuse inmediato al cliente ("recibido, te llamamos hoy"). *Refuerza la promesa, baja no-shows; reutiliza `emailLayout`.*
_B3 completada (2026-07-15) → ✅ HECHO (misma entrega que I5)._
- [ ] **B4** — [MEDIO / BAJO] Capturar origen/UTM del lead (campos ocultos + columna) para atribución de canal.
- [ ] **B5** — [MEDIO / MEDIO] Prueba social sobria a partir del email "valóranos" (enlace a reseñas de Google, tono antimarketing).
- [ ] **B6** — [MEDIO / BAJO] WhatsApp como canal de contacto (enlace `wa.me` discreto junto al teléfono).
- [ ] **B7** — [MEDIO / BAJO] Analítica de embudo del formulario (eventos GA4 de inicio/abandono por campo).

---

## ✅ HECHO

- [x] **M15 · M16 · M17 · M18 · M19** — 2026-07-21 — [Copy] Coherencia de mensaje: (M15) el email de resumen usa los rótulos EXACTOS de "Mudanza de vivienda" desde una fuente única `lib/servicios.ts` (`SERVICIO_LABEL`), compartida con `Servicios.tsx` para que no se desincronicen; la web agrupa montaje/desmontaje y protección/embalaje en un servicio, así que el email une esos interruptores. (M16) primer contacto (telefónico) unificado a "Te llamamos": `faq.ts` ("Te contactamos"→"Te llamamos") y `privacidad` ("ponernos en contacto contigo"→"llamarte"); el resto ya era coherente y el "contactar" usuario→empresa de `condiciones` se mantiene. (M17) verificado que "Comenzar" (nav) enlaza a `#presupuesto`; sin incoherencia → sin cambios. (M18) en el desglose del panel, etiqueta "Personal"→"Operarios" (la variable `coste_personal` no se toca). (M19) privacidad y cookies son informativas (no contractuales) y ya usan el tono cercano "tú"; documentada la decisión con un comentario en cada una; aviso-legal/condiciones/cancelación siguen en impersonal. `lib/servicios.ts`, `Servicios.tsx`, `emailActions.ts`, `faq.ts`, `privacidad/page.tsx`, `cookies/page.tsx`, `PresupuestoForm.tsx`.
- [x] **M5 · M6 · M8 · M9 · M10 · M11 · M12 · M13 · M14** — 2026-07-21 — [UX] Formulario público: (M5) el consentimiento cuenta como 6.º requisito de la barra de progreso y del check del botón (el botón sigue sin deshabilitarse; error + foco a la casilla al enviar sin marcarla, I4); (M6) el número de portal de una dirección elegida se valida por su `street_number` real (fuente de verdad mientras no se edite; el código postal ya no la da por válida), con fallback de dígito tecleado para escritura a mano, sin tocar la carga bajo demanda de Maps (I7); (M9) en escritorio el clic/teclado fija el servicio y el hover solo previsualiza (al salir vuelve al fijado); móvil por tap. Panel: (M10) feedback al copiar el enlace de pago (check + "Copiado"; si falla, aviso y enlace seleccionado para copiar a mano); (M11) los bloques de cobro/envío de los presupuestos no vigentes se pliegan por defecto, el vigente los mantiene visibles; (M12) nota + title que explican que un presupuesto en formato anterior se consulta pero no se reabre. Confirmación: (M13) el paso completado muestra un check en vez del "0" (la landing sigue con 1·2·3, componente compartido intacto); (M14) se reitera el plazo ("Te llamamos el mismo día laborable"). (M8) verificado que el scrollspy conserva el enlace activo anterior al pasar por la banda del Manifiesto; sin cambios. `QuoteForm.tsx`, `AddressAutocomplete.tsx`, `Servicios.tsx`, `PagoPresupuesto.tsx`, `PresupuestoPanel.tsx`, `PasosProceso.tsx`, `solicitud-recibida/page.tsx`.
- [x] **M1 · M2 · M3 · M4** — 2026-07-20 — [Marca/Diseño] Coherencia visual: (M1) `field.ts` adopta el criterio tipográfico fluido de `button.ts` (`sm`/`md`→`text-small`, `lg`→`text-body`, mín. 14px en el campo público; escritorio idéntico); (M2) el check "activo" de Servicios baja a `strokeWidth 1.5`; (M3) `InstagramIcon` rehecho como glifo sólido (`fill`, un solo path) como el resto de BrandIcons, sin trazos y aún reconocible; (M4) semáforo de estado del panel centralizado en tokens `--color-status-*` (warning/success/info/danger + danger-strong) en globals.css, documentado como excepción funcional a la paleta monocroma (interno, no visible al cliente); valores = paleta Tailwind, aspecto idéntico. Aplicado en `EstadoPill`, badge de pago pendiente de la lista, avisos de la ficha de operaciones y avisos de coste/margen del presupuesto. `ui/field.ts`, `Servicios.tsx`, `BrandIcons.tsx`, `globals.css`, `EstadoPill.tsx`, `page.tsx`, `operaciones/[id]/page.tsx`, `PresupuestoForm.tsx`.
- [x] **M20 · M21 · M22 · M23** — 2026-07-20 — [SEO] `robots` con `disallow: "/admin"` (ruta exacta, sin barra); confirmación sin salto H1→H3 (nivel de encabezado ajustado en PasosProceso/H2 intermedio); `sitemap` con fecha estable para las legales en vez de `new Date()`; `twitter.site: "@mudanzasx_ai"` añadido. `robots.ts`, `solicitud-recibida/page.tsx`, `PasosProceso.tsx`, `sitemap.ts`, `layout.tsx`.
- [x] **M34 · M35 · M36 · M37 · M38** — 2026-07-20 — [Limpieza] Eliminado el export muerto `TELEFONO_DISPLAY`; eliminado el type sin usar `ConsentCategory`; quitado el `export` innecesario de `CONSENT_STORAGE_KEY`; reutilizado `CheckMark`/`<Check>` en vez del path SVG duplicado del botón de envío; recortados comentarios verbosos/obvios sobre one-liners. `config.ts`, `consent.ts`, `QuoteForm.tsx`, `ui/icon.ts`, `leads.ts`, `Manifiesto.tsx`.
- [x] **`public/servicios.webp`** — eliminada (2026-07-20). Huérfana, 0 referencias, ~51 KB (resto de la versión anterior de Servicios).
- [x] **I9 · M26** — 2026-07-17 — [SEO/Limpieza] `image` del JSON-LD MovingCompany repuntado a `servicio-transporte.webp` (el camión, visible en la web) y comentario corregido; la huérfana `embalaje-cuidado-mueble.jpg` (117 KB) eliminada del disco. `page.tsx`.
- [x] **I10** — 2026-07-17 — [Marca] Radios arbitrarios del panel del hero tokenizados: nuevos `--radius-hero` (1.75rem) y `--radius-hero-lg` (2.5rem); `rounded-t-hero md:rounded-t-hero-lg`. Mismo aspecto. `globals.css`, `Hero.tsx`.
- [x] **I11** — 2026-07-17 — [Marca] Tipografía secundaria en px → tokens fluidos (`text-[13px]/[14px]→text-small`, `text-[15px]→text-body`) en QuoteForm, Hero y Faq. `QuoteForm.tsx`, `Hero.tsx`, `Faq.tsx`.
- [x] **I12** — 2026-07-17 — [Marca] Chevron del acordeón del panel unificado con el público: `size 20` + `strokeWidth 1.5`. `PresupuestoPanel.tsx`.
- [x] **I13** — 2026-07-17 — [Refactor] Ondas concéntricas extraídas a `OndasConcentricas.tsx` (props para color/origen/viewBox/radio/opacidad), usado en Manifiesto y QuoteForm. Salida byte-idéntica. `OndasConcentricas.tsx`.
- [x] **I5 · B3** — 2026-07-15 — [UX/Panel] Lista de leads con vista de tarjetas apiladas en móvil (tabla `hidden md:block`, tarjetas `md:hidden`) sobre la misma lista del servidor: nombre, pill de estado, ruta, pago pendiente, teléfono `tel:` (≥44px) y fecha. Tarjeta navega a la ficha (enlace estirado); el teléfono es acción propia. Buscador/filtro/realtime afectan a ambas vistas. `admin/(panel)/page.tsx`.
- [x] **I7** — 2026-07-15 — [Rendimiento] Google Maps (Places) ya no carga en el montaje: `usePlaces` expone `ensureLoaded()` (carga única compartida) y `AddressAutocomplete` la dispara en el primer `onFocus` de un campo de dirección (hero o formulario). Salvaguardas: campo usable mientras carga, re-búsqueda al llegar la librería sin perder texto, y degradación si falla. `googleMaps.ts`, `AddressAutocomplete.tsx`.
- [x] **I8** — 2026-07-15 — [Rendimiento] Turnstile se monta bajo demanda vía IntersectionObserver cuando el formulario está a ~2 pantallas (`rootMargin 0px 0px 200% 0px`), una sola vez. Salvaguardas: fallback sin IO y montaje en el submit con mensaje "en curso" (lógica I3 intacta). Server-side sin cambios. `QuoteForm.tsx`.
- [x] **I2** — 2026-07-15 — [UX/Panel] Al guardar un presupuesto nuevo, el panel adopta el `id` devuelto y pasa a modo "Actualizar" (un segundo guardado actualiza esa fila, no duplica). "+ Nuevo presupuesto" sigue empezando en blanco. `PresupuestoPanel.tsx`.
- [x] **I3** — 2026-07-15 — [UX] Turnstile: flag `turnstileFailed` (error/expired) → al enviar sin token se muestra "Recarga la página" en fallo duro y "Espera un momento" solo mientras resuelve. Server-side intacto. `QuoteForm.tsx`.
- [x] **I4** — 2026-07-15 — [UX] Al enviar con errores, foco + scroll suave al primer campo inválido (orden visual, incl. número de calle y consentimiento) + resumen `role="alert"` junto al botón. Respeta `prefers-reduced-motion`; el botón no se deshabilita. `QuoteForm.tsx`.
- [x] **C1** — 2026-07-15 — [Copy] Un solo significado para el "5%": eliminado el descuento estacional; la topbar pasa a "5% de descuento por pago anticipado". El único 5% (pago anticipado del 100%) es coherente en web, emails y panel. `Topbar.tsx`.
- [x] **I6** — 2026-07-15 — [Copy] Badge del formulario "10 min" → "Llamada de 10 min" (duración de la llamada, no plazo); fila con `flex-wrap` para no desbordar en móvil. El plazo real sigue siendo "el mismo día laborable" (FAQ). `QuoteForm.tsx`.
- [x] **I1 · B1** — 2026-07-15 — [UX/Operativa] Notificación instantánea al negocio al entrar un lead por la web: email vía Resend (teléfono como enlace `tel:`, datos del lead y botón a la ficha). Envío no bloqueante para la creación del lead; solo la vía web (el alta manual no notifica). `api/lead/route.ts`, `lib/email.ts`.
- [x] **B8** — 2026-07-15 — [Idea/Operativa] Aviso en tiempo real en el panel al entrar un lead (Supabase Realtime + sonido + toast). Implementado tras la auditoría a petición del propietario. `components/admin/AvisosLead.tsx`.
- [x] **M39** — 2026-07-15 — [UX] Header de las páginas legales sticky, para que el botón de volver esté siempre accesible en páginas largas. `LegalShell`. *(Hallazgo del propietario, no de la auditoría.)*
