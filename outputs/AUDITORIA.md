# 📋 Informe de auditoría — Mudanzas X

**Fecha:** 2026-07-08
**Alcance:** landing pública, panel `/admin`, páginas legales, emails, motor de presupuesto, seguridad y calidad de código.
**Fase 1: solo auditoría, sin cambios.** No se ha modificado ningún archivo de código.

---

## Resumen ejecutivo — lo que hay que mirar primero

| # | Severidad | Área | Hallazgo | Impacto |
|---|-----------|------|----------|---------|
| **1** | 🔴 CRÍTICO | Presupuesto | `coste_personal` multiplica horas-persona **otra vez** por nº operarios → sobrecoste ~+74% que **crece al añadir gente** | Casi todos los presupuestos mal calculados |
| **2** | 🔴 CRÍTICO | Seguridad | Server Actions y `/admin` solo comprueban "sesión válida", no rol admin | Si el signup público de Supabase está activo, cualquiera accede al panel |
| **3** | 🔴 CRÍTICO | Seguridad | `/api/lead` sin rate-limit ni captcha + anon key permite saltarse la validación | Spam de leads / inserción arbitraria |
| **4** | 🟠 IMPORTANTE | Presupuesto | Precio ajustado a mano no recalcula `margen`/`iva`/`coste_base` guardados | Reporte de beneficio falseado |
| **5** | 🟠 IMPORTANTE | Presupuesto | `coste_vehiculo = tarifa_dia × dias × viajes` doble-cuenta los viajes | Sobrecoste en mudanzas multi-viaje |
| **6** | 🟠 IMPORTANTE | Copy | `condiciones` mezcla tuteo e impersonal **en la misma página** | Ruptura de voz visible |
| **7** | 🟠 IMPORTANTE | SEO | Falta `sitemap.ts` y `robots.ts`; `/admin/login` indexable | Descubribilidad / crawl budget |
| **8** | 🟠 IMPORTANTE | Diseño | No hay tokens de radio/borde/sombra → deriva; rojo/ámbar rompe paleta en formularios | Incoherencia de marca |

**Veredicto general:** el proyecto está **bien construido**. La landing es muy coherente con la marca, el webhook de Stripe es robusto, no hay secretos expuestos, no hay manipulación de precios desde el cliente, ESLint pasa limpio y no hay comentarios "tipo IA". Los problemas serios se concentran en **(a) la matemática del motor de personal/vehículo, (b) la autorización (rol admin) y (c) la falta de un sistema de tokens de diseño**.

---

## 1. COHERENCIA DE MARCA Y DISEÑO

Auditoría contra el spec de marca (Montserrat; paleta estricta blanco `#FFFFFF` / negro `#000000` / gris `#F3F3F3`; estilo minimalista Uber-like, sobrio, "antimarketing"; secciones en zebra blanco/gris).

### Mapa zebra (orden real en `src/app/page.tsx`) — CORRECTO

| # | Sección | Componente | Fondo real | Fuente (file:line) | Alternancia |
|---|---------|-----------|-----------|--------------------|-------------|
| — | Topbar | `Topbar.tsx` | **Negro** `bg-black` | Topbar.tsx:3 | (banda promo) |
| — | Header | `Header.tsx` | **Blanco** `bg-white` | Header.tsx:20 | (nav sticky) |
| 1 | Hero | `Hero.tsx` | **Gris** `bg-gris` | Hero.tsx:33 | GRIS |
| 2 | Cómo funciona | `HowItWorks.tsx` | **Blanco** (body, sin `bg`) | HowItWorks.tsx:12 | BLANCO |
| 3 | Servicios | `Servicios.tsx` | **Gris** `bg-gris` | Servicios.tsx:18 | GRIS |
| 4 | FAQ | `Faq.tsx` | **Blanco** (body, sin `bg`) | Faq.tsx:38 | BLANCO |
| 5 | Presupuesto | `QuoteForm.tsx` | **Gris** `bg-gris` | QuoteForm.tsx:158 | GRIS |
| — | Footer | `Footer.tsx` | **Negro** `bg-black` | Footer.tsx:31 | (cierre) |

**Resultado:** la zebra es coherente (gris → blanco → gris → blanco → gris), enmarcada por negro arriba y abajo. Único matiz menor: las secciones blancas (2 y 4) no declaran `bg-white` explícito y dependen del `body` (`layout.tsx:65`), mientras las grises sí → el patrón no es simétrico en el código.

### 🔴 CRÍTICO

- **No existen tokens de radio/borde/sombra** — `globals.css:3-14` solo define tokens de color (`--background`, `--foreground`, `--gris`) y la fuente. Es la **causa raíz** de casi toda la deriva: conviven `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`; opacidades de borde 5/8/10/15/20%; sombras `sm/lg/xl`.
  **Fix:** añadir en `@theme` tokens `--radius-card` (1rem = `rounded-2xl`), `--radius-field` (0.5rem), `--radius-pill` (9999px) y `--hairline: rgba(0,0,0,0.10)`, y usarlos en lugar de literales.

### 🟠 IMPORTANTE

- **Colores fuera de paleta en formularios públicos (rojo/ámbar)** — ámbar en `Hero.tsx:93`, `QuoteForm.tsx:184,206`; rojo en `QuoteForm.tsx:260,289,318`. La paleta es estricta B/N/gris.
  **Fix:** expresar errores en negro con refuerzo tipográfico (peso 500 + icono/subrayado), como ya hace el login.
- **Tratamiento de error inconsistente entre formularios** — login en negro (`LoginForm.tsx:74`) vs formulario de presupuesto en rojo (`QuoteForm.tsx:318,260,289`). Dos formularios equivalentes, dos lenguajes visuales.
  **Fix:** unificar en el tratamiento monocromo del login.
- **Peso 600 no cargado** — `layout.tsx:12` carga Montserrat solo en 400/500, pero se usa `font-semibold` (600) en `HowItWorks.tsx:49` y varios del admin (`PresupuestoForm.tsx:770,801`, `calendario/page.tsx:202`, `OperacionForm.tsx:248,257`) → faux-bold sintético.
  **Fix:** añadir `"600"` al array de `weight` o sustituir `font-semibold` por `font-medium`.
- **Título de la sección Presupuesto rompe jerarquía y escala** — `QuoteForm.tsx:163` usa `<h3>` a `text-xl` (20px) mientras las secciones hermanas usan `<h2>` con `clamp(1.75rem, 3.5vw, 2.5rem)` (`HowItWorks.tsx:27`, `Servicios.tsx:37`, `Faq.tsx:53`). Doble incoherencia: semántica (salta h1→h3 sin h2) y visual.
  **Fix:** convertir en `<h2>` con el mismo clamp. *(SEO reporta lo mismo.)*

### 🟡 MENOR

- Dos tratamientos de "tarjeta" para elementos equivalentes: Servicios blanca elevada (`Servicios.tsx:48`, `rounded-2xl bg-white shadow-sm ring-1 ring-black/5`) vs FAQ gris plana (`Faq.tsx:63`, `rounded-2xl bg-gris`). **Fix:** un único `Card` con regla fija.
- `SectionImage` pierde su marco sobre fondo gris en Servicios (el gris `#F3F3F3` está "horneado" en el WebP y se funde con el fondo). **Fix:** borde/ring sutil o fondo blanco en sección gris.
- Botones secundarios divergentes: `border-black/15`+`hover:bg-gris` vs `border-black/20`+`hover:bg-white`. **Fix:** un único `ButtonSecondary`.
- Botón primario sin primitivo: 5 tamaños de padding redeclarados (`px-8 py-4` … `px-3 py-2`). **Fix:** extraer `Button` con `size`/`variant` (el hover `hover:bg-black/85` y radio `rounded-full` sí son consistentes).
- Fragmentación de radios: landing usa `rounded-2xl` (tarjetas) / `rounded-lg` (inputs); admin usa `rounded-lg` para tarjetas + radios sueltos (`rounded-md`, `rounded`, `rounded-xl`). Conteo global: `rounded-full`×48, `rounded-lg`×40, `rounded-2xl`×7, `rounded-md`×4, `rounded-xl`×1. **Fix:** consolidar a 3 radios tokenizados.
- Ancho de contenedor asimétrico: FAQ `max-w-[1100px]` (`Faq.tsx:39`) vs `1200px` del resto.
- Ritmo vertical con 3 cadencias: `md:py-24` (secciones), `md:py-20` (Footer/LegalShell), `md:py-28` (`solicitud-recibida`).
- Tres estilos de input: público `bg-white`+`border-black/10` / admin `bg-gris`+`border-transparent` / Hero underline `border-b`.
- Patrón "pasos numerados" duplicado con medidas distintas: `HowItWorks.tsx:44-52` (círculo `h-11 w-11`) vs `solicitud-recibida/page.tsx:64-73` (círculo `h-8 w-8`). **Fix:** extraer `StepList`.
- **Sistema "semáforo" del admin fuera de paleta** (ámbar/esmeralda/slate/rojo en `EstadoPill.tsx:27-30`, `page.tsx:158-159`, `operaciones/[id]/page.tsx:322,326`, y errores/éxitos dispersos). Atenuante: herramienta interna con valor funcional real. **Fix:** decidir explícitamente que el admin admite un subsistema semántico acotado y tokenizarlo (`--state-warning/success/danger`), o usar señalética monocroma.
- Emails con 6 grises fuera de paleta (`#333/#666/#888/#aaa/#eee/#f7f7f7`) en `email.ts` y `emailLayout.ts`. **Fix:** reducir a negro + `#F3F3F3` + opacidades.

**Positivo:** paleta de la landing impecable (opacidades de negro en vez de grises inventados); títulos con un único `font-medium` + `tracking-[-0.02em]`; CTAs pill negro con hover idéntico; iconografía propia coherente (`SystemIcons`/`BrandIcons`); tono antimarketing respetado.

---

## 2. UX / USABILIDAD

*No hay defectos críticos que bloqueen flujos; los estados asíncronos principales (botones que se deshabilitan, "Enviando…", `role="status"`/`role="alert"`) están bien resueltos. Lo más cercano a crítico: D1 y C1.*

### A. Flujo público (formulario de presupuesto)

**🟠 IMPORTANTE**
- **A1 — Error "Indica el número de la calle" engañoso** (`QuoteForm.tsx:55-58,183-187` + `AddressAutocomplete.tsx:86-91`): `origenNum`/`destinoNum` solo se ponen a `true` al **elegir una sugerencia** con `street_number`; escribir la dirección a mano con número dispara el error igual. **Fix:** aceptar número por regex `/\d+/` o cambiar el mensaje.
- **A2 — Validación mixta** (`QuoteForm.tsx:219,302` con `required` nativo vs errores inline propios en `:259-263,288-292`): el globo nativo del navegador choca con la marca y ejecuta antes que la validación del número. **Fix:** unificar todo a inline propio.
- **A3 — CTA ambiguo:** el botón dice solo `Presupuesto` (`QuoteForm.tsx:328`). **Fix:** "Solicitar presupuesto".

**🟡 MENOR**
- A4 — Degradación silenciosa si Google Places falla (`QuoteForm.tsx:40,54`): campo pasa a texto normal sin avisar.
- A5 — El dropdown de sugerencias no muestra estado de carga (`AddressAutocomplete.tsx:57-91`).

**Positivo:** `solicitud-recibida` es buen final de flujo (confirmación + "qué pasa ahora" + "volver al inicio", `page.tsx:82-88`).

### B. Flujo admin

**🟠 IMPORTANTE**
- **B1 — Búsqueda de leads sin botón ni pista de "pulsa Enter"** (`LeadsFilters.tsx:33-48`): teclear no filtra hasta Enter, mientras el `<select>` de estado (`:50-54`) aplica al instante → parece roto. **Fix:** botón "Buscar" o debounce.
- **B2 — Fila de lead no clicable** (`page.tsx:113-141`): solo el nombre enlaza; objetivo táctil pequeño en móvil. **Fix:** fila entera clicable.
- **B3 — Edición de ficha no valida teléfono/email** (`EditLeadForm.tsx:69-71`) a diferencia del alta (`NuevoLeadForm.tsx:84-109`) → contactos no contactables que rompen envío de pago/resumen. **Fix:** reutilizar la validación del alta.

**🟡 MENOR**
- B4 — Error de login en negro, no rojo (`LoginForm.tsx:74`, `text-black`) frente a `text-red-600` del resto.
- B5 — Confirmaciones de éxito demasiado sutiles (`EditLeadForm.tsx:155-159`, `PresupuestoForm.tsx:827`, `text-black/60`).
- B6 — Reset de formulario por cambio de props puede descartar ediciones sin guardar (`EditLeadForm.tsx:32-40`, `OperacionForm.tsx:51-63`).

**Positivo:** cabecera persistente con navegación, back-links en todas las fichas de detalle y enlaces cruzados lead↔operación.

### C. Sub-flujo Presupuesto → Cobro

**🟠 IMPORTANTE**
- **C1 — El resultado del cálculo desaparece en silencio** al tocar cualquier dato (`PresupuestoForm.tsx:206-209` `invalidar()`, invocado desde casi todos los `onChange`): el usuario ve desaparecer el precio sin explicación. **Fix:** atenuar + aviso "Los datos han cambiado, pulsa Calcular".
- **C2 — Rejilla de distancia de 3 columnas en móvil** (`PresupuestoForm.tsx:535` `grid-cols-3` sin breakpoint): a ~360px los inputs quedan ~100px con etiquetas a 2-3 líneas. **Fix:** `grid-cols-1 sm:grid-cols-3`.

**🟡 MENOR**
- C3 — Objetivos táctiles pequeños (<44px) en líneas de inventario/producto (`PresupuestoForm.tsx:441,521,671-683`).
- C4 — Copiar al portapapeles sin feedback de fallo (`PagoPresupuesto.tsx:103-112`).
- C5 — Sin realtime tras pago desde email (el banner "Pago recibido" solo aparece con `?pago=ok`, `leads/[id]/page.tsx:162-172`).

**Positivo:** avisos de margen ("Por debajo del coste base: PÉRDIDAS" / "<10%") en `PresupuestoForm.tsx:800-808` son excelente prevención de errores.

### D. Responsive / móvil

**🟠 IMPORTANTE**
- **D1 — Callejón sin salida en el calendario** (`calendario/page.tsx:189-219`): con >3 operaciones/día, el "+N más" es un `<span>` no clicable (`:215-219`) y no hay vista de día → esas operaciones son **inaccesibles** desde el calendario. **Fix:** enlazar "+N más" a una vista de día.
- **D2 — Calendario de 7 columnas ilegible en móvil** (`calendario/page.tsx:186-224`): ~50px/columna, nombres truncados. **Fix:** vista lista/agenda por debajo de un breakpoint.

**🟡 MENOR**
- D3 — Tabla de leads sin vista en tarjetas en móvil (`page.tsx:99-100`, correctamente scrollable pero obliga a scroll lateral).

### E. Navegación admin

- **Positivo:** cabecera persistente, back-links y enlaces cruzados. Sin breadcrumbs, pero los back-links los suplen.
- **A verificar (producto):** no hay entrada en la UI para **crear una operación manualmente** (parecen originarse solo al confirmar pago). Confirmar si es intencional.

---

## 3. COPYWRITING Y TONO

Voz de referencia: sobria, profesional, minimalista, "antimarketing". El objetivo es un copy **sincronizado** (que se hable igual en todas partes).

*Nota de alcance: el panel `/admin` es interno (no es voz de marca de cara al cliente); sus incidencias van como internas/menores. Los **emails sí son voz de marca** y son el punto más sensible.*

### 🔴 CRÍTICO

- **`condiciones/page.tsx` se contradice a sí misma:** tutea en `:21` ("Para cualquier consulta **puedes contactar**…") pero usa impersonal en el resto (`:48,60` "**el cliente** abona…", "**El cliente** se compromete…"). Es el salto tonal más visible del proyecto.
  **Fix:** fijar la regla "cliente = tú, empresa = nosotros" y aplicarla, o pasar todo el bloque contractual a impersonal (y limpiar los "tú" residuales).

### 🟠 IMPORTANTE

- **"a las mil maravillas"** (`email.ts:211`): modismo efusivo que choca con la voz sobria. **Fix:** "…haya salido según lo previsto."
- **Botón "Presupuesto" (sustantivo) vs "Calcular presupuesto"** (`Hero.tsx:109`): dos botones que hacen lo mismo con etiquetas distintas. **Fix:** unificar a "Solicitar presupuesto".
- **Promesa de contacto contradictoria:** "hoy mismo" (`solicitud-recibida/page.tsx:51`) vs "el mismo día laborable" (`Faq.tsx:26`), y ambas chocan con el horario del footer (domingo cerrado). **Fix:** usar "el mismo día laborable" en ambos.

### 🟡 MENOR

- "lo dejamos todo listo" (`email.ts:185`); acumulación persuasiva del email de valoración ("Nos encantaría / mudanza de confianza / Solo te llevará un minuto", `email.ts:212`); "si te encaja" (`solicitud-recibida/page.tsx:18`); asuntos de email en registro ligero ("¿Qué te ha parecido tu mudanza?", `email.ts:223`, vs los sobrios "Pago de tu mudanza"); saludo "Hola cliente," por fallback (`emailActions.ts:113,149`); doble sentido del "5% de descuento" (estacional en `Topbar.tsx:5` vs pago adelantado en `Faq.tsx:18`); "un minuto" (`layout.tsx:25`) vs "10 minutos" (`QuoteForm.tsx:164`); formato desigual de respuestas FAQ (`Faq.tsx:10-31`); y (interno) "¡Copiado!" (`PagoPresupuesto.tsx:197`) y avisos con "⚠/PÉRDIDAS" en mayúsculas (`PresupuestoForm.tsx:802-806`).

### Glosario de inconsistencias (variantes para el mismo concepto)

| Concepto | Variantes encontradas | Dónde |
|---|---|---|
| CTA "pedir presupuesto" | "Calcular presupuesto" · "Presupuesto" (sustantivo) · "Pide tu presupuesto" | Hero.tsx:109 · QuoteForm.tsx:328 · layout.tsx:25 |
| El presupuesto / precio | "presupuesto" · "presupuesto cerrado" · "resumen del servicio" · "resumen de tu mudanza" | Faq.tsx:18,26 · email.ts:189,195 · EnviarResumenBoton.tsx:36 |
| Persona que contrata | "cliente" · "usuario" · "el interesado" | condiciones/cancelacion · aviso-legal:20,59 · privacidad:91 |
| CTA "llamar" | "Llamar" · "Llámanos" | Header.tsx:53 · email.ts:185-186 |
| Lo que se mueve | "enseres" · "objetos" · "elementos a transportar" · "lo que mueves" | condiciones:32,60 · email.ts:155 · Faq.tsx:14 |
| El equipo | "operarios" · "personal cualificado" · "el equipo" | Faq.tsx:14 · condiciones:88 · email.ts:214 |
| Territorio | "la península" · "la península ibérica" · "toda la península" | Faq.tsx:10 · condiciones:30 · layout.tsx:25 |

### Tuteo vs Usted

- **Web, confirmación y emails:** tutean al cliente (TÚ) de forma consistente. Privacidad y cookies también tutean.
- **Páginas contractuales** (aviso-legal, condiciones, cancelación): tercera persona impersonal ("el usuario"/"el cliente"). Instancias impersonales: `aviso-legal:20,59,61-62,67`, `condiciones:48,60`, `cancelacion:25,41,55`.
- **FAQ** usa vosotros en las preguntas ("¿hacéis…?", "¿Trabajáis…?", `Faq.tsx:9,21,25`) con respuestas en "nosotros" — recurso deliberado, cuarta variante de tratamiento.
- **Recomendación:** definir por escrito "cliente = tú, empresa = nosotros" y unificar el bloque legal a esa norma, o delimitar el impersonal solo al bloque contractual y eliminar los "tú" residuales (empezando por `condiciones:21`).

**Positivo:** "mudanza" siempre (nunca "traslado"); empresa siempre en "nosotros"; botonera de cookies homogénea.

---

## 4. SEO

**Base sólida:** `metadataBase` (`layout.tsx:28`), title template `%s · Mudanzas X`, OG+Twitter completos (`/og.png` 1200×630), `<html lang="es">`, JSON-LD `MovingCompany` con NAP real (`page.tsx:14-44`), un solo `<h1>` (`Hero.tsx:36`), alt descriptivo en todas las imágenes, `/solicitud-recibida` con `noindex`.

### 🔴 CRÍTICO

- **Falta `src/app/sitemap.ts`** (verificado ausente; Next 16 no lo autogenera). **Fix:** sitemap con home + 5 legales:
  ```ts
  import type { MetadataRoute } from "next";
  export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://www.mudanzasx.com";
    const rutas = ["", "/aviso-legal", "/condiciones", "/privacidad", "/cookies", "/cancelacion"];
    return rutas.map((r) => ({ url: `${base}${r}`, lastModified: new Date(),
      changeFrequency: r === "" ? "weekly" : "yearly", priority: r === "" ? 1 : 0.5 }));
  }
  ```

### 🟠 IMPORTANTE

- **Falta `src/app/robots.ts`** — sin directivas de crawl, sin `disallow: /admin/`, sin puntero al sitemap. **Fix:**
  ```ts
  import type { MetadataRoute } from "next";
  export default function robots(): MetadataRoute.Robots {
    return { rules: { userAgent: "*", allow: "/", disallow: "/admin/" },
      sitemap: "https://www.mudanzasx.com/sitemap.xml" };
  }
  ```
- **`/admin/login` es indexable** (`admin/login/page.tsx` no exporta metadata; el proxy lo deja en HTTP 200). **Fix:** `export const metadata = { title: "Acceso", robots: { index: false, follow: false } };` + el `disallow: /admin/`.
- **FAQ sin `FAQPage` JSON-LD** — hay 6 Q&A reales en `Faq.tsx:7-32` sin marcar. Rich result de alto valor y bajo riesgo. **Fix:** exportar el array `PREGUNTAS` y emitir el JSON-LD `FAQPage` en `page.tsx`.

### 🟡 MENOR

- Sin canonical propio en páginas legales (solo home, `layout.tsx:38`).
- `MovingCompany` JSON-LD sin `sameAs` (5 redes en `Footer.tsx:14-18`), `openingHoursSpecification` (`Footer.tsx:70-76`) ni `priceRange`.
- Salto de heading en `QuoteForm.tsx:163` (`h3` sin `h2` — coincide con el hallazgo de diseño).
- Alt de OG pobre ("Mudanzas X", `layout.tsx:47`) y sin handle de Twitter (`site`/`creator`).

### Tabla de cobertura de metadata

| Ruta | title | description | canonical | robots | Notas |
|------|:-----:|:-----------:|:---------:|:------:|-------|
| `/` (home) | ✅ | ✅ | ✅ `/` | index | |
| `/aviso-legal` | ✅ | ✅ | ❌ | index | |
| `/condiciones` | ✅ | ✅ | ❌ | index | |
| `/privacidad` | ✅ | ✅ | ❌ | index | |
| `/cookies` | ✅ | ✅ | ❌ | index | |
| `/cancelacion` | ✅ | ✅ | ❌ | index | |
| `/solicitud-recibida` | ✅ | ✅ | ❌ | **noindex ✅** | |
| `/admin/login` | ❌ | ❌ | ❌ | **index ⚠️** | sin metadata |
| `/admin/(panel)/*` | ❌ | ❌ | ❌ | index (302) | redirigido |

Todas las imágenes tienen alt correcto (auditadas: HowItWorks, Servicios, Faq, logos, email, iconos de marca `aria-hidden` con `aria-label`). `SectionImage` fija `width`/`height`/`sizes` → sin CLS.

---

## 5. MOTOR DE PRESUPUESTO Y MATEMÁTICA

### Flujo de la fórmula (`calcularPresupuesto`, `src/lib/presupuesto.ts:173`)

Las tarifas viven en DB (`config_precios`, `vehiculos`), no en `config.ts`. `calcularInterno` (`presupuestoActions.ts:295`) relee objetos/productos/config/vehículos de Supabase y **nunca confía en números del cliente**.

1. **Volumen neto** = Σ(objetos vol×cant) + Σ(productos vol×cant); usa `volumen_desmontado_m3` solo si el switch Desmontaje está activo (`:194`).
2. **Volumen real ocupado** = `volumen_neto / factor_aprovechamiento` (`:237`; con 0.8 → ×1.25). **Dirección correcta.**
3. **Vehículo/viajes** (`:240-259`): menor vehículo con `capacidad_util_m3 >= volumen_real`; si ninguno cabe, mayor con `viajes = ceil(vol/cap)`.
4. **Horas** (`:262-272`): `manejo = vol × factor_manejo`; `km_ruta = base→origen + origen→destino + destino→base`; `km_totales = km_ruta × viajes`; `trayecto = km_totales / velocidad`; total = manejo + desmontaje + montaje + trayecto + buffer.
5. **Operarios** (`:275-278`): ≤ umbral2 → 2; ≤ umbral3 → 3; else 4.
6. **Duración** (`:287-297`): `duracion_trabajo = horas_trabajo_persona / (operarios × factor_paralelo)`; `dias = max(1, ceil(duracion_total / jornada_h))`.
7. **Líneas de coste**: vehículo, distancia, personal, embalaje, productos, extras (accesos).
8. **Orden final** (`:325-349`): base → ×(1+urgencia) → ×(1+margen) → + punto limpio (sin margen) → ×(1+IVA). **IVA aplicado una sola vez, sin doble IVA.**

### 🔴 CRÍTICO

- **F1 — `coste_personal` doble-cuenta los operarios.** `presupuesto.ts:287-292` trata `horas_manejo/desmontaje/montaje` como **horas-persona** (las divide por `operarios × factor_paralelo` para la duración), pero `:307` las multiplica **otra vez** por `operarios`: `COSTE_PERSONAL_HORA × operarios × horas_totales`. El factor de sobrecoste sobre la mano de obra de manipulación es `operarios × factor_paralelo` (1.6× con 2 operarios, hasta 3.2× con 4). **Añadir gente encarece el presupuesto** — lo contrario del modelo de `:292`.
  - **Ejemplo:** 20 m³ (`factor_manejo=0.4` → 8 h-persona), trayecto 2h, buffer 1h, 3 operarios, factor 0.8, 15 €/h. Código: `15 × 3 × 11 = 495 €`. Coherente con la duración (`duracion_total = 8/(3×0.8) + 2 + 1 = 6.33h`): `15 × 3 × 6.33 = 285 €`. **Sobrecoste ~210 € (+74%)** en este presupuesto, y empeora con más operarios.
  - **Fix:** facturar sobre tiempo real: `coste_personal = COSTE_PERSONAL_HORA × operarios × duracion_total` (o quitar la división de `:292` — pero **una de las dos** debe cambiar; no pueden ser ambas correctas).

### 🟠 IMPORTANTE

- **F2 — Precio ajustado no recalcula el desglose guardado.** `presupuestoActions.ts:359` sobreescribe `precio_final` pero `:397-403` guarda `coste_base`/`margen`/`iva` sin ajustar; el registro deja de cuadrar. `margenAjustado` (`presupuesto.ts:400`) solo se usa para el hint de la UI, no al guardar.
  - **Ejemplo:** engine calcula 1633.50 (coste 1000, margen 300, punto limpio 50, IVA 283.50). Operador ajusta a **1400**. Se guarda `precio_final=1400` pero `margen=300`/`iva=283.50` (suma 1633.50 ≠ 1400). Margen real 157, IVA real 243. Beneficio inflado ~143 €/presupuesto.
  - **Fix:** recomputar y guardar el desglose con `margenAjustado` cuando `ajustado != null`.
- **F3 — `coste_vehiculo = tarifa_dia × dias × viajes` doble-cuenta viajes** (`presupuesto.ts:300`). `dias` ya se infla por el tiempo de trayecto de todos los viajes (`:265-266`), y `coste_distancia` ya escala con `km_totales × viajes`. Un solo camión varios viajes en el mismo día debería cobrar tarifa/día, no ×viajes.
  - **Ejemplo:** vol 30, cap 20 → 2 viajes, 1 día, 200 €/día → `200×1×2=400 €` cuando debería ser 200 € (el combustible del 2º viaje ya está en distancia). Sobrecoste ~200 €.
  - **Fix:** decidir el modelo — `tarifa_dia × dias` sin `×viajes`, o modelar viajes como días separados sin inflar también el tiempo.

### 🟡 MENOR

- **F5 —** `margenAjustado` cuenta el punto limpio como margen (`presupuesto.ts:405-407`: subtotal lo incluye, `costeBase` no) → margen real sobrestimado; sesga los avisos `<10%`/pérdidas. **Fix:** restar `cargo_punto_limpio` antes de calcular el margen.
- **F6 —** Divisores sin cota inferior estricta (`presupuestoActions.ts:109-115`): `velocidad_media_kmh=0`→`Infinity`, `jornada_h=0`→`Infinity`, `capacidad_util_m3=0`→`Infinity`. Margen/IVA negativos de DB no se rechazan. **Fix:** exigir `>0` y clamplear.
- **F7 —** El desglose mostrado redondea cada línea por separado (`PresupuestoForm.tsx:749-771`) → descuadre cosmético de ±0.01 (el `precio_final` guardado es correcto).

### Verificado correcto (sin hallazgo)

Volumen y factor de aprovechamiento (dirección correcta, guardado contra factor≤0); selección de vehículo con frontera `>=`, orden ascendente y fallback al mayor con `ceil`; umbrales de operarios (`<=`, suelo 2); factor paralelo/duración (sin div-por-cero, `dias` con suelo 1, nunca no-físico); embalaje (unidades `m³ × m/m³ × €/m = €`); orden margen/IVA/punto limpio/urgencia (IVA una vez); casos límite (volumen cero, solo-productos, solo-embalaje, ajuste negativo rechazado en `:354-357`). Los "3 tramos" de distancia son **legs aditivos** (`:263-264`), no tramos de precio → sin problema de frontera; precio continuo y monótono en km.

---

## 6. SEGURIDAD

**Base sólida:** sin secretos hardcodeados; service role correctamente aislado (`getSupabaseAdmin()` local en el webhook, `route.ts:14-25`, nunca en cliente); webhook de Stripe robusto (firma verificada con `constructEvent` sobre cuerpo crudo `request.text()`, runtime nodejs, idempotencia por `lead_id`); sin manipulación de precios desde el cliente (todo se recalcula en servidor, `pagoActions.ts:73-97`); `.env*` gitignored; `getUser()` revalida el token en el proxy (`supabase/proxy.ts:35-38`).

### 🔴 CRÍTICO (autorización — el hueco de fondo)

- **Server Actions y `/admin` solo comprueban "sesión válida", no rol admin.** `proxy.ts:12` (`if (!user && !isLogin)`) y `requireUser` en todas las actions (`pagoActions.ts:45-51`, `presupuestoActions.ts:86-92`, `emailActions.ts:15-21`, `actions.ts:39-43`, `nuevo/actions.ts:48-53`, `operaciones/[id]/actions.ts:32-37`) solo verifican que exista sesión. Las RLS mostradas conceden acceso a **cualquier** `authenticated` (`operarios` SELECT `using(true)`, `leads` INSERT `with check(true)`).
  **Ataque:** si el signup público de Supabase está activo (default frecuente), cualquiera hace `signUp` y obtiene sesión "authenticated" → pasa el proxy → invoca todas las actions (leer/editar leads, **generar enlaces de pago Stripe**, enviar emails vía Resend).
  **Fix:** deshabilitar signup público **y** añadir comprobación de rol explícita (tabla `admins`/allowlist o custom claim) en `proxy.ts` y en un helper compartido, y endurecer RLS para exigir ese rol.
- **`/api/lead` sin rate-limit/captcha + validación evitable.** `route.ts:50-57` inserta con la anon key (pública, `supabaseClient.ts:14`) y RLS `anon` INSERT `with check(true)`.
  **Ataque:** (1) un bot inunda `/api/lead` de leads basura; (2) un atacante llama directo a la REST API de Supabase saltándose `esTelefonoEsValido`/`esEmailValido` e insertando cualquier valor en columnas accesibles a `anon`.
  **Fix:** rate-limit por IP + captcha/Turnstile verificado en el endpoint; RLS restrictiva por columnas/valores (o canalizar por función con service role tras validar, revocando el INSERT directo de `anon`).

### 🟡 MENOR

- Clientes Supabase duplicados/solapados (4 inicializaciones) — riesgo de mantenibilidad, no fuga de secreto (ninguno filtra el service role).
- `success_url`/`cancel_url` de Stripe construidas desde el header `Host` (`pagoActions.ts:53-59`). **Fix:** usar `NEXT_PUBLIC_SITE_URL` de confianza.
- **Operativo (no código):** restringir `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` por dominio/referrer en Google Cloud Console.

**Nota de alcance:** solo hay 2 migraciones en `supabase/migrations/`; las RLS de la mayoría de tablas (`presupuestos`, `pagos`, `operaciones`, `config_precios`, `vehiculos`, `objetos`, `productos`) se gestionan manualmente en el dashboard y **no se han podido verificar** — conviene auditarlas, en especial que no expongan datos de clientes al rol `anon`.

---

## 7. CALIDAD DE CÓDIGO

**ESLint pasa limpio (exit 0, sin warnings/errores).** No hay imports sin usar ni código muerto detectable. **No se encontraron comentarios "tipo IA"** — los ~526 comentarios son de calidad, en español, explican el *por qué* (no el *qué*) y parecen escritos por un humano (ej. `webhook/route.ts:34-36`, `presupuesto.ts:30-37`, `supabase/server.ts:29-31`).

### 🟡 MENOR

- **`fieldClass` copiado en 7 archivos** — `LeadFields.tsx:7` (exportado) + redefiniciones locales en `LeadsFilters.tsx:7`, `QuoteForm.tsx:17`, `OperacionForm.tsx:8`, `PresupuestoForm.tsx:24`, `LoginForm.tsx:8`. `OperacionForm.tsx:8` es **byte-idéntico** al exportado → importarlo. Los otros son variantes → helper `field()` o `@apply`.
- `type IconProps` idéntico en `BrandIcons.tsx:5` y `SystemIcons.tsx:5` → mover a un módulo compartido.
- `src/lib/supabaseClient.ts` fuera de la convención `supabase/` y con SDK distinto (`@supabase/supabase-js` vs `@supabase/ssr`) → mover a `src/lib/supabase/anon.ts` y actualizar el único importador (`api/lead/route.ts:2`).
- Boilerplate de env-guard repetido en las 4 factorías de cliente → `getSupabaseEnv()`.

**Falsos positivos verificados (NO son duplicados, ambos usados):** `supabaseClient.ts` (anon, `/api/lead`) vs `supabase/client.ts` (browser SSR, login); `src/proxy.ts` (middleware Next 16) vs `src/lib/supabase/proxy.ts` (helper `updateSession`); `BrandIcons` (5 redes) vs `SystemIcons` (16 glifos UI). Formateo de moneda/fecha ya centralizado en `leads.ts`. `console.log` solo 3, todos logging estructurado del webhook. TODOs solo 2, deliberados (`AnalyticsScripts.tsx:61,66`).

---

## 🗑️ ARCHIVOS CANDIDATOS A ELIMINAR

*Solo entradas con 0 referencias probadas por grep. **No borrar aún** — confirmar antes con el diseñador.*

| Archivo | Motivo | Evidencia |
|---|---|---|
| `public/app-movil-presupuesto.jpg` | Imagen huérfana, nunca renderizada | 0 refs |
| `public/como-funciona-movil.webp` | Huérfana (variante móvil sin cablear) | 0 refs |
| `public/faq-operario.webp` | Huérfana; se usa `faqs.webp` | 0 refs |
| `public/servicios-embalaje.webp` | Huérfana; se usa `servicios.webp` + `embalaje-cuidado-mueble.jpg` | 0 refs |
| `public/servicios-vivienda.webp` | Huérfana (variante sin cablear) | 0 refs |

**Prioridad [MENOR]** — ~250 KB de peso muerto, sin impacto de correctitud. Ojo: `como-funciona-movil` y `servicios-vivienda` parecen variantes responsive **intencionadas pero no cableadas** → confirmar con el diseñador antes de borrar.

**Casos especiales (recomiendo CONSERVAR):**
- **`scripts/gen-icons.mjs`** — 0 referencias, pero **genera los iconos en uso** (`icon-192/512.png`, `og.png`, `apple-icon.png`). Conservar y, opcionalmente, cablear como `"gen:icons": "node scripts/gen-icons.mjs"` en package.json.
- `docs/superpowers/specs/2026-07-01-admin-panel-fase-1-design.md` — doc de diseño / historia del proyecto.

**No existen** archivos `*.test.*`, `*.spec.*`, `*.bak`, `*.old` ni `.env*` versionados. Todos los demás assets de `public/` y todos los `src/lib/*` están referenciados.

---

## Orden de actuación sugerido para las siguientes fases

1. **Matemática (F1)** — el bug de `coste_personal` está mal-cotizando casi todos los presupuestos; es lo primero.
2. **Seguridad (rol admin + rate-limit en `/api/lead`)** — cerrar el hueco de autorización antes de exponer más.
3. **Tokens de diseño en `globals.css`** — desbloquea corregir radios, errores rojo/ámbar y peso 600 de forma sistemática.
4. **SEO (`robots.ts` + `sitemap.ts` + noindex admin + FAQPage)** — rápido y de alto retorno.
5. **Copy sincronizado** — regla "cliente = tú / empresa = nosotros", unificar CTA y arreglar `condiciones`.
6. **UX** — D1 (calendario) y C1 (resultado que desaparece), luego validación de edición y responsive.
7. **Limpieza** — imágenes huérfanas y de-duplicación de `fieldClass`.
