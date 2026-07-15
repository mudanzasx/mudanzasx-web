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
- [ ] **C1** — Unificar el significado del "5% de descuento": estacional en el Topbar vs pago anticipado en FAQ/pasos/email. `Topbar.tsx:8` vs `faq.ts:15`, `PasosProceso.tsx:14`, `condiciones/page.tsx:51`, `email.ts:68`. *Nota: es una promesa sobre dinero; no puede leerse como dos cosas distintas. Decidir un único mensaje.*

---

## 🟠 IMPORTANTES

### UX / Operativa
- [ ] **I1** — Notificar al negocio cuando entra un lead (email vía Resend, opcional WhatsApp/Telegram). `api/lead/route.ts:156-174`. *Hoy el lead solo se ve abriendo el panel → riesgo de leads perdidos. (= idea B1.)*
- [ ] **I2** — Evitar el duplicado al reguardar un presupuesto nuevo: adoptar `res.id` tras guardar (modo "Actualizar") o deshabilitar hasta que cambie un campo. `PresupuestoForm.tsx:346-367`, `PresupuestoPanel.tsx:72-75`.
- [ ] **I3** — Turnstile: no enmascarar el fallo duro como "espera un momento"; mantener el mensaje de recarga (flag `turnstileFailed`). `QuoteForm.tsx:225-230`.
- [ ] **I4** — Al enviar con error, llevar foco/scroll al primer campo inválido (o resumen `aria-live` sobre el botón). `QuoteForm.tsx:191-221`. *En móvil el botón está abajo y el toque "parece muerto".*
- [ ] **I5** — Vista móvil (tarjetas apiladas) para la lista de leads en vez de tabla con scroll horizontal. `admin/(panel)/page.tsx:100-101`. *(= idea B3.)*

### Copy
- [ ] **I6** — Unificar el plazo de contacto: "10 min" (form) vs "el mismo día laborable" (FAQ). `QuoteForm.tsx:324-328` vs `faq.ts:23`.

### Rendimiento
- [ ] **I7** — Cargar Google Maps solo al primer foco/tecla del campo de dirección, no en el montaje del Hero. `googleMaps.ts:132`, `Hero.tsx:13`.
- [ ] **I8** — Cargar Turnstile bajo demanda (IntersectionObserver al acercarse el formulario, o `strategy="lazyOnload"`). `Turnstile.tsx:108`, `QuoteForm.tsx:544`.

### SEO
- [ ] **I9** — Apuntar el `image` del JSON-LD MovingCompany a una imagen real y visible (`og.png` o `servicio-transporte.webp`) y corregir el comentario erróneo ("la del camión"). `page.tsx:15,25`.

### Marca / Diseño
- [ ] **I10** — Sustituir los radios arbitrarios del panel del Hero por token (`rounded-t-card`, o nuevo `--radius-hero` documentado). `Hero.tsx:76`.
- [ ] **I11** — Migrar la tipografía secundaria en px a tokens fluidos (`text-[13px]→text-small`, `[11px]→text-nav`, consolidar `[15px]`). `QuoteForm.tsx:24`, `Hero.tsx:136`, `QuoteForm.tsx:510,568`, `Faq.tsx:59`.
- [ ] **I12** — Unificar el chevron del acordeón admin con el público: `strokeWidth={1.5}` y mismo tamaño. `PresupuestoPanel.tsx:144-149` (cf. `Faq.tsx:45`).

### Limpieza / Refactor
- [ ] **I13** — Extraer un componente reutilizable `OndasConcentricas` y usarlo en Manifiesto y QuoteForm (algoritmo SVG duplicado). `Manifiesto.tsx:12-48`, `QuoteForm.tsx:26-34,274-293`.

---

## 🟡 MENORES

### Marca / Diseño
- [ ] **M1** — Alinear `field.ts` con `button.ts` usando tipografía fluida (`text-small`/clamp). `ui/field.ts:17-21`.
- [ ] **M2** — Bajar el Check de Servicios a `strokeWidth={1.5}` (o anotar la excepción en `ui/icon.ts`). `Servicios.tsx:123`.
- [ ] **M3** — Rehacer el icono de Instagram como glifo sólido (o trazo 1.5) para igualar al resto del set. `BrandIcons.tsx:34,41`.
- [ ] **M4** — Documentar (o tokenizar como `--color-status-*`) la excepción de colores de estado del panel (amber/emerald/slate/red). `EstadoPill.tsx`, `PresupuestoForm.tsx`, `operaciones/[id]/page.tsx`.

### UX
- [ ] **M5** — Incluir la casilla de consentimiento en la señal de "completado" (barra de progreso y check del botón). `QuoteForm.tsx:177,314,592`.
- [ ] **M6** — Validar el número de calle por el `street_number` de la sugerencia elegida, no por cualquier dígito. `AddressAutocomplete.tsx:91`.
- [ ] **M7** — Sincronizar `--fixed-top` con la altura real que mide el scrollspy. `globals.css:63-69`, `Header.tsx:52`.
- [ ] **M8** — (Opcional) Dar identidad al Manifiesto en el scrollspy o aceptar el hueco de "activo". `Header.tsx:12-18`.
- [ ] **M9** — (Opcional) En escritorio, cambiar de servicio con click (o delay de hover) en vez de `onMouseEnter`. `Servicios.tsx:105`.
- [ ] **M10** — Dar feedback si falla copiar el enlace de pago. `PagoPresupuesto.tsx:104-113`.
- [ ] **M11** — Colapsar los bloques Cobro/Enviar-resumen de los presupuestos no activos. `PresupuestoPanel.tsx:115-124`.
- [ ] **M12** — Explicar (title/nota) por qué un presupuesto "formato antiguo" no se puede reabrir. `PresupuestoPanel.tsx:97-109`.
- [ ] **M13** — En la confirmación, mostrar un check en el paso completado en vez del numeral "0". `PasosProceso.tsx:39,44,64`.
- [ ] **M14** — Reiterar el plazo prometido en la confirmación ("te llamamos en ~X"). `solicitud-recibida/page.tsx:93-107`.

### Copy
- [ ] **M15** — Usar los rótulos exactos de `Servicios.tsx` en el email de resumen. `emailActions.ts:98-101` vs `Servicios.tsx:21-45`.
- [ ] **M16** — Unificar "Te llamamos" vs "Te contactamos" (si el primer contacto es telefónico). `faq.ts:23` (cf. `QuoteForm.tsx:324`, `PasosProceso.tsx:10`).
- [ ] **M17** — (Opcional) Alinear el ancla de nav "Comenzar" con el concepto "Presupuesto/Solicitar". `Header.tsx:17`, `QuoteForm.tsx:324,607`.
- [ ] **M18** — Unificar "Operarios" vs "Personal" en todo el panel. `leads/[id]/page.tsx:219,240` (cf. desglose "Personal").
- [ ] **M19** — Decidir y documentar el registro: privacidad/cookies (tú) vs contractuales (impersonal). `privacidad/page.tsx`, `cookies/page.tsx`.

### SEO
- [ ] **M20** — `robots`: usar `disallow: "/admin"` (sin barra) para cubrir la ruta exacta. `robots.ts:5`.
- [ ] **M21** — Evitar el salto H1→H3 en la confirmación (nivel de encabezado configurable en PasosProceso o H2 intermedio). `solicitud-recibida/page.tsx:93`, `PasosProceso.tsx:69`.
- [ ] **M22** — `sitemap`: fecha estable para las legales en vez de `new Date()`. `sitemap.ts:17`.
- [ ] **M23** — Añadir `twitter.site: "@mudanzasx_ai"`. `layout.tsx:55`.

### Rendimiento
- [ ] **M24** — (Opcional) Renderizar solo la imagen de servicio activa (+ prefetch de la siguiente) en vez de las 4 capas. `Servicios.tsx:74-91`.
- [ ] **M25** — Quitar `priority` de los logos del header (el LCP es el hero). `Header.tsx:131-148`.
- [ ] **M26** — Recomprimir o repuntar `embalaje-cuidado-mueble.jpg` (117KB, solo en JSON-LD). `page.tsx:25`. *(Ligado a I9.)*
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
- [ ] **M34** — Eliminar el export muerto `TELEFONO_DISPLAY`. `config.ts:9`.
- [ ] **M35** — Eliminar el type sin usar `ConsentCategory`. `consent.ts:10`.
- [ ] **M36** — Quitar el `export` innecesario de `CONSENT_STORAGE_KEY`. `consent.ts:27`.
- [ ] **M37** — Reutilizar `CheckMark`/`<Check>` en vez del path SVG duplicado en el botón de envío. `QuoteForm.tsx:47-58,593-605`.
- [ ] **M38** — Recortar comentarios verbosos/obvios sobre one-liners. `config.ts:2,5`, `ui/icon.ts:3-5`, `consent.ts:19`, `leads.ts:56`, `Manifiesto.tsx:1-9`, `QuoteForm.tsx:36-38`.

---

## 🧹 LIMPIEZA — archivos / exports a eliminar

- [ ] Eliminar `public/servicios.webp` — huérfana, 0 referencias, ~51 KB (resto de la versión anterior de Servicios).
- [ ] Eliminar export `TELEFONO_DISPLAY` — `config.ts:9`. *(= M34.)*
- [ ] Eliminar type `ConsentCategory` — `consent.ts:10`. *(= M35.)*
- [ ] Quitar `export` de `CONSENT_STORAGE_KEY` — `consent.ts:27`. *(= M36.)*
- ⚠️ **Precaución `public/embalaje-cuidado-mueble.jpg`:** NO borrar todavía — solo se referencia en el `image` del JSON-LD (`page.tsx:25`). Primero repuntar ese campo a una imagen visible (I9); una vez repuntado, es candidata a eliminar/recomprimir (M26).

---

## 💡 IDEAS DE NEGOCIO

Priorizadas por impacto/esfuerzo (mayor a menor).

- [ ] **B1** — [ALTO / BAJO] Notificación instantánea de lead al negocio (email Resend + opcional WhatsApp/Telegram). *La más rentable; hoy no se avisa. (= I1.)*
- [ ] **B2** — [MEDIO-ALTO / BAJO] Email de acuse inmediato al cliente ("recibido, te llamamos hoy"). *Refuerza la promesa, baja no-shows; reutiliza `emailLayout`.*
- [ ] **B3** — [MEDIO / MEDIO] Vista móvil de la lista de leads para operar desde el móvil. *(= I5.)*
- [ ] **B4** — [MEDIO / BAJO] Capturar origen/UTM del lead (campos ocultos + columna) para atribución de canal.
- [ ] **B5** — [MEDIO / MEDIO] Prueba social sobria a partir del email "valóranos" (enlace a reseñas de Google, tono antimarketing).
- [ ] **B6** — [MEDIO / BAJO] WhatsApp como canal de contacto (enlace `wa.me` discreto junto al teléfono).
- [ ] **B7** — [MEDIO / BAJO] Analítica de embudo del formulario (eventos GA4 de inicio/abandono por campo).

---

## ✅ HECHO

- [x] **M39** — 2026-07-15 — [UX] Header de las páginas legales sticky, para que el botón de volver esté siempre accesible en páginas largas. `LegalShell`. *(Hallazgo del propietario, no de la auditoría.)*
