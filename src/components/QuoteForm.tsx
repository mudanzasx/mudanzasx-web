"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuote } from "./QuoteContext";
import AddressAutocomplete from "./AddressAutocomplete";
import { usePlaces } from "@/lib/googleMaps";
import {
  esTelefonoEsValido,
  esEmailValido,
  AVISO_TELEFONO,
  AVISO_EMAIL,
} from "@/lib/validaciones";
import { btn } from "@/components/ui/button";
import { useRipple } from "@/components/ui/useRipple";
import { field } from "@/components/ui/field";
import { Clock } from "lucide-react";
import Turnstile, { type TurnstileHandle } from "./Turnstile";
import OndasConcentricas from "./OndasConcentricas";

// Campo base dentro de la tarjeta: fondo blanco, borde sutil que se marca al
// enfocar. `pr-11` reserva sitio a la derecha para la marca de validación, así
// no hay salto de layout cuando el check aparece.
const fieldClass = field({ variant: "public", size: "lg", className: "pr-11" });
const errorClass = "mt-1.5 text-small font-medium";

// Glifo de check monocromo (path propio; nunca verde, paleta estricta de marca).
// Compartido por la marca de validación de los campos y el botón de envío.
function CheckGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4 4 10-11" />
    </svg>
  );
}

// Marca de validación dentro del campo: aparece con una transición breve que
// respeta prefers-reduced-motion.
function CheckMark({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-all duration-200 ease-out motion-reduce:transition-none ${
        show ? "scale-100 opacity-100" : "scale-90 opacity-0"
      }`}
    >
      <CheckGlyph />
    </span>
  );
}

export default function QuoteForm() {
  const { prefill } = useQuote();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

  // form.telefono guarda solo los 9 dígitos; el +34 se añade al enviar.
  const [form, setForm] = useState({
    origen: "",
    destino: "",
    nombre: "",
    telefono: "",
    email: "",
    acepta: false,
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    ref: rippleRef,
    onPointerDown: onRipplePointerDown,
    onKeyDown: onRippleKeyDown,
  } = useRipple<HTMLButtonElement>();

  // Cloudflare Turnstile (captcha). Activo solo si hay site key configurada.
  const turnstileHabilitado = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  // Fallo DURO del widget (error/expiración/no carga): distingue "recargar" de
  // "espera un momento" al intentar enviar sin token (I3).
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  // Carga perezosa del widget: no se monta hasta que el formulario se acerca al
  // viewport (I8), para que esté resuelto cuando el usuario llegue a rellenarlo.
  const [mostrarTurnstile, setMostrarTurnstile] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  // Validación del número de calle (Google Places). Si Google no está
  // disponible, no se exige (degradación) para no bloquear el envío.
  const { failed: mapsFailed } = usePlaces();
  const [origenNum, setOrigenNum] = useState(false);
  const [destinoNum, setDestinoNum] = useState(false);
  const [intentado, setIntentado] = useState(false);

  // Errores mostrados junto a cada campo (validación propia, inline y monocroma).
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [aceptaError, setAceptaError] = useState<string | null>(null);
  // Resumen accesible (aria-live) al enviar con errores (I4).
  const [resumenError, setResumenError] = useState<string | null>(null);
  const aceptaRef = useRef<HTMLInputElement>(null);

  // Teléfono: 9 dígitos válidos (el prefijo +34 lo pone el propio campo).
  const validarTelefono = (v: string) =>
    esTelefonoEsValido(v) ? null : AVISO_TELEFONO;
  const validarEmail = (v: string) =>
    esEmailValido(v) ? null : AVISO_EMAIL;
  const exigirNumero = !mapsFailed;
  const faltaOrigenNum =
    exigirNumero && form.origen.trim() !== "" && !origenNum;
  const faltaDestinoNum =
    exigirNumero && form.destino.trim() !== "" && !destinoNum;

  // Referencias en orden para enfocar el primer campo vacío tras el prefill.
  const origenRef = useRef<HTMLInputElement>(null);
  const destinoRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Cuando el hero pulsa "Solicitar presupuesto": rellena, hace scroll y enfoca.
  useEffect(() => {
    if (prefill.nonce === 0) return;

    const next = {
      origen: prefill.origen,
      destino: prefill.destino,
    };
    // El prefill del hero es un evento externo puntual (un clic que cambia el
    // nonce); sincronizarlo aquí no encadena renders. Falso positivo de la regla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({ ...prev, ...next }));
    // El hero ya validó el número de calle de cada dirección; lo respetamos.
    setOrigenNum(prefill.origenValida);
    setDestinoNum(prefill.destinoValida);

    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Enfoca el primer campo vacío una vez actualizado el estado.
    requestAnimationFrame(() => {
      const merged = { ...form, ...next };
      const orden: { valor: unknown; enfocar: () => void }[] = [
        { valor: merged.origen, enfocar: () => origenRef.current?.focus() },
        { valor: merged.destino, enfocar: () => destinoRef.current?.focus() },
        { valor: merged.nombre, enfocar: () => nombreRef.current?.focus() },
        { valor: merged.telefono, enfocar: () => telefonoRef.current?.focus() },
        { valor: merged.email, enfocar: () => emailRef.current?.focus() },
      ];
      for (const campo of orden) {
        if (!String(campo.valor ?? "").trim()) {
          campo.enfocar();
          break;
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill.nonce]);

  // I8 — Monta Turnstile cuando el formulario se acerca al viewport (rootMargin
  // generoso: ~2 pantallas antes de entrar en vista), para que el widget esté
  // cargado y resuelto al llegar el usuario. Se dispara una sola vez. Salvaguarda:
  // si el navegador no soporta IntersectionObserver, se monta ya.
  useEffect(() => {
    if (!turnstileHabilitado) return;
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Sin IntersectionObserver (navegador muy antiguo): se monta ya, para no
      // quedarnos sin verificación. Es un fallback puntual, no un patrón.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMostrarTurnstile(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMostrarTurnstile(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 200% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [turnstileHabilitado]);

  // Validez por campo (en vivo) para la barra de progreso y las marcas de
  // validación. Un campo de dirección es válido si tiene texto y número de
  // calle (o si Google no está disponible y no se exige número).
  const origenOk = form.origen.trim() !== "" && (origenNum || !exigirNumero);
  const destinoOk = form.destino.trim() !== "" && (destinoNum || !exigirNumero);
  const nombreOk = form.nombre.trim() !== "";
  const telefonoOk = esTelefonoEsValido(form.telefono);
  const emailOk = esEmailValido(form.email);
  // 5 campos + la casilla de consentimiento = 6 requisitos = 6 tramos de la
  // barra. El consentimiento cuenta como uno más: sin marcarlo el progreso no
  // llega al 100% ni el botón muestra el check (M5). El botón nunca se
  // deshabilita: al pulsarlo sin la casilla, la validación muestra el error y
  // enfoca la casilla (I4).
  const aceptaOk = form.acepta;
  const completos =
    Number(origenOk) +
    Number(destinoOk) +
    Number(nombreOk) +
    Number(telefonoOk) +
    Number(emailOk) +
    Number(aceptaOk);
  const listo = completos === 6;

  const update =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setResumenError(null);

    // Validación propia (sin globos nativos): contacto, nombre y aceptación.
    const telErr = validarTelefono(form.telefono);
    const emErr = validarEmail(form.email);
    const nomErr = form.nombre.trim() ? null : "Indica tu nombre y apellidos.";
    const aceptaErr = form.acepta
      ? null
      : "Debes aceptar la Política de privacidad.";
    setTelefonoError(telErr);
    setEmailError(emErr);
    setNombreError(nomErr);
    setAceptaError(aceptaErr);

    const origenVacio = form.origen.trim() === "";
    const destinoVacio = form.destino.trim() === "";

    // Primer campo inválido en ORDEN VISUAL. La dirección exige texto y número
    // de calle (cuando Google está disponible).
    const camposInvalidos: { malo: boolean; el: () => HTMLElement | null }[] = [
      { malo: origenVacio || faltaOrigenNum, el: () => origenRef.current },
      { malo: destinoVacio || faltaDestinoNum, el: () => destinoRef.current },
      { malo: Boolean(nomErr), el: () => nombreRef.current },
      { malo: Boolean(telErr), el: () => telefonoRef.current },
      { malo: Boolean(emErr), el: () => emailRef.current },
      { malo: Boolean(aceptaErr), el: () => aceptaRef.current },
    ];
    const primero = camposInvalidos.find((c) => c.malo);
    if (primero) {
      // I4: foco + scroll suave al primer campo con error, para que el usuario
      // (sobre todo en móvil, con el botón al final) vea al instante qué falta.
      // block:"center" lo deja a media pantalla, despejado del bloque fijo
      // superior. Se respeta prefers-reduced-motion (salto directo).
      const el = primero.el();
      if (el) {
        const reduce =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.focus({ preventScroll: true });
        el.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        });
      }
      // Resumen anunciado por lectores de pantalla al pulsar.
      setResumenError(
        "Faltan campos por completar. Revisa lo marcado y vuelve a enviar."
      );
      return;
    }

    // Verificación de seguridad. Se distingue el fallo DURO del widget (hay que
    // recargar) del estado "aún resolviendo" (esperar), para no dejar al usuario
    // esperando algo que no se va a resolver solo.
    if (turnstileHabilitado && !turnstileToken) {
      // Salvaguarda (I8): si el usuario llegó al formulario tan rápido que el
      // widget aún no se había montado, se monta ahora para que resuelva cuanto
      // antes; el mensaje de "en curso" acompaña mientras tanto.
      if (!mostrarTurnstile) setMostrarTurnstile(true);
      setTurnstileError(
        turnstileFailed
          ? "No se pudo cargar la verificación de seguridad. Recarga la página e inténtalo de nuevo."
          : "Verificación de seguridad pendiente. Espera un momento e inténtalo de nuevo."
      );
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      // Se guarda el teléfono completo con prefijo (+34 + 9 dígitos).
      const payload = {
        ...form,
        telefono: `+34 ${form.telefono}`,
        turnstileToken,
      };
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("No se pudo enviar la solicitud.");
      }
      // Redirige a la página propia de confirmación (URL medible). El parámetro
      // marca el envío legítimo: la página lo comprueba y, si falta (acceso
      // directo por URL), redirige a la home.
      router.push("/solicitud-recibida?ok=1");
    } catch {
      setError(
        "No se pudo enviar la solicitud. Revisa los datos e inténtalo de nuevo."
      );
      setEnviando(false);
      // Turnstile invalida el token al usarse: se reinicia para poder reintentar.
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  return (
    <section
      id="presupuesto"
      ref={sectionRef}
      className="relative w-full overflow-hidden border-t border-hairline bg-white"
    >
      {/* Ondas de marca detrás de la tarjeta: origen en el centro de la sección
          (tras la tarjeta), arcos negros sobre claro reforzados (opacidad
          ~24% → 2%) para percibirse a través del vidrio; overflow-hidden de la
          sección los recorta en los bordes. */}
      <OndasConcentricas
        viewBox="0 0 1000 1000"
        originX={500}
        originY={500}
        baseRadius={70}
        stroke="#000000"
        opacityStart={0.24}
      />

      <div className="relative z-10 mx-auto max-w-[460px] px-6 py-14 md:py-24">
        {/* Tarjeta gris de marca (#F3F3F3) sólida sobre la sección blanca, con
            hairline sutil y la sombra única de marca. Opaca: las ondas del fondo
            quedan detrás (se intuyen en los márgenes de la sección) sin ensuciar
            la tarjeta. Los campos y elementos van en blanco para destacar. */}
        <div className="relative overflow-hidden rounded-card border border-hairline bg-gris shadow-card">
          {/* Barra de progreso fina (3px) pegada al borde superior interior
              (como la barra de carga de una app). Sin pista: con progreso 0 el
              canto superior se ve limpio. El relleno es una línea NEGRA plena
              que crece desde la izquierda (scaleX con origen izquierdo) conforme
              se validan los campos; sin texto ni porcentaje. El overflow-hidden
              de la tarjeta la recorta al radio superior. Transición suave sobre
              transform; se anula con prefers-reduced-motion. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-10 h-[3px]"
          >
            <div
              className="h-full w-full origin-left bg-black transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `scaleX(${completos / 6})` }}
            />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Cuerpo traslúcido: cabecera y campos sobre el vidrio. */}
            <div className="p-6 md:p-8">
              {/* Cabecera: titular corto + badge de la DURACIÓN de la llamada
                  (no del plazo de contacto, que es "el mismo día laborable").
                  flex-wrap: en móvil estrecho (~360px) la píldora baja a su
                  propia línea en vez de desbordar; whitespace-nowrap la mantiene
                  en una sola línea. */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-medium leading-tight tracking-[-0.02em] text-black">
                  Te llamamos
                </h2>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-black">
                  <Clock size={14} strokeWidth={1.5} />
                  Llamada de 10 min
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Origen y destino: mismo bloque blanco que el hero (carril
                    con marcadores circulares, conector vertical y campos
                    transparentes), idéntico para coherencia; destaca en blanco
                    sobre la tarjeta gris. */}
                <div>
                  <div className="relative rounded-card border border-hairline bg-white px-4 py-2 shadow-card md:px-5">
                    {/* Conector que une el centro de ambos marcadores (36px→92px). */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-[36px] left-[26px] h-[56px] w-px -translate-x-1/2 bg-black/30 md:left-[30px]"
                    />

                    {/* Fila Origen */}
                    <div className="grid h-14 grid-cols-[20px_1fr] items-center">
                      <span className="flex items-center justify-center">
                        <span className="block h-2.5 w-2.5 rounded-pill bg-black" />
                      </span>
                      <AddressAutocomplete
                        id="origen"
                        inputRef={origenRef}
                        value={form.origen}
                        onChange={(v, hasNumber) => {
                          setForm((prev) => ({ ...prev, origen: v }));
                          setOrigenNum(hasNumber);
                        }}
                        required
                        placeholder="Dirección de origen"
                        ariaLabel="Dirección de origen"
                        wrapperClassName="col-start-2"
                        className="w-full border-b border-hairline bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
                      />
                    </div>

                    {/* Fila Destino */}
                    <div className="grid h-14 grid-cols-[20px_1fr] items-center">
                      <span className="flex items-center justify-center">
                        <span className="block h-2.5 w-2.5 rounded-pill bg-black" />
                      </span>
                      <AddressAutocomplete
                        id="destino"
                        inputRef={destinoRef}
                        value={form.destino}
                        onChange={(v, hasNumber) => {
                          setForm((prev) => ({ ...prev, destino: v }));
                          setDestinoNum(hasNumber);
                        }}
                        required
                        placeholder="Dirección de destino"
                        ariaLabel="Dirección de destino"
                        wrapperClassName="col-start-2"
                        className="w-full bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
                      />
                    </div>
                  </div>

                  {/* Errores de dirección (validación intacta). */}
                  {intentado && form.origen.trim() === "" ? (
                    <p className={`${errorClass} text-black`}>
                      Indica la dirección de origen.
                    </p>
                  ) : intentado && faltaOrigenNum ? (
                    <p className={`${errorClass} text-black`}>
                      Indica el número de la calle.
                    </p>
                  ) : null}
                  {intentado && form.destino.trim() === "" ? (
                    <p className={`${errorClass} text-black`}>
                      Indica la dirección de destino.
                    </p>
                  ) : intentado && faltaDestinoNum ? (
                    <p className={`${errorClass} text-black`}>
                      Indica el número de la calle.
                    </p>
                  ) : null}
                </div>

                {/* Nombre */}
                <div>
                  <div className="relative">
                    <input
                      id="nombre"
                      ref={nombreRef}
                      type="text"
                      value={form.nombre}
                      onChange={(e) => {
                        update("nombre")(e);
                        if (nombreError) setNombreError(null);
                      }}
                      aria-label="Nombre y apellidos"
                      aria-invalid={nombreError ? true : undefined}
                      placeholder="Nombre y apellidos"
                      className={fieldClass}
                    />
                    <CheckMark show={nombreOk} />
                  </div>
                  {nombreError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {nombreError}
                    </p>
                  )}
                </div>

                {/* Teléfono (con +34 fijo) */}
                <div>
                  <div className="relative flex items-stretch overflow-hidden rounded-field border border-hairline bg-white transition-colors duration-150 focus-within:border-black">
                    <span className="flex select-none items-center border-r border-hairline pl-4 pr-3 text-base text-black/50">
                      +34
                    </span>
                    <input
                      id="telefono"
                      ref={telefonoRef}
                      type="tel"
                      inputMode="numeric"
                      value={form.telefono}
                      onChange={(e) => {
                        const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
                        setForm((prev) => ({ ...prev, telefono: digitos }));
                        if (telefonoError && esTelefonoEsValido(digitos)) {
                          setTelefonoError(null);
                        }
                      }}
                      onBlur={() =>
                        setTelefonoError(
                          form.telefono.trim()
                            ? validarTelefono(form.telefono)
                            : null
                        )
                      }
                      required
                      aria-label="Teléfono"
                      placeholder="600 000 000"
                      aria-invalid={telefonoError ? true : undefined}
                      className="w-full min-w-0 bg-transparent py-3 pl-3 pr-11 text-base text-black placeholder-black/40 outline-none"
                    />
                    <CheckMark show={telefonoOk} />
                  </div>
                  {telefonoError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {telefonoError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <div className="relative">
                    <input
                      id="email"
                      ref={emailRef}
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((prev) => ({ ...prev, email: v }));
                        if (emailError && esEmailValido(v)) setEmailError(null);
                      }}
                      onBlur={() =>
                        setEmailError(
                          form.email.trim() ? validarEmail(form.email) : null
                        )
                      }
                      required
                      aria-label="Email"
                      placeholder="Email"
                      aria-invalid={emailError ? true : undefined}
                      className={fieldClass}
                    />
                    <CheckMark show={emailOk} />
                  </div>
                  {emailError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-5 flex items-start gap-3 text-small leading-[1.5] text-black/70">
                <input
                  ref={aceptaRef}
                  type="checkbox"
                  checked={form.acepta}
                  onChange={(e) => {
                    update("acepta")(e);
                    if (aceptaError) setAceptaError(null);
                  }}
                  aria-invalid={aceptaError ? true : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-black"
                />
                <span>
                  He leído y acepto la{" "}
                  <a
                    href="/privacidad"
                    className="text-black underline underline-offset-2"
                  >
                    Política de privacidad
                  </a>
                  .
                </span>
              </label>
              {aceptaError && (
                <p className={`${errorClass} text-black`} role="alert">
                  {aceptaError}
                </p>
              )}
            </div>

            {/* Pie anclado (zona de acción): parte de la tarjeta gris, separado
                del cuerpo por una hairline y siguiendo el radio inferior de la
                tarjeta (overflow-hidden del contenedor). El ojo cae de forma
                natural aquí. Contiene Turnstile y el botón. */}
            <div className="flex flex-col gap-4 border-t border-hairline px-6 py-5 md:px-8 md:py-6">
              {turnstileHabilitado && mostrarTurnstile && (
                <div>
                  <Turnstile
                    ref={turnstileRef}
                    onToken={(t) => {
                      setTurnstileToken(t);
                      setTurnstileError(null);
                      setTurnstileFailed(false);
                    }}
                    onError={() => {
                      setTurnstileToken(null);
                      setTurnstileFailed(true);
                      setTurnstileError(
                        "No se pudo cargar la verificación de seguridad. Recarga la página e inténtalo de nuevo."
                      );
                    }}
                  />
                  {turnstileError && (
                    <p className={`${errorClass} text-center text-black`} role="alert">
                      {turnstileError}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-body font-medium text-black" role="alert">
                  {error}
                </p>
              )}

              {/* Resumen accesible al enviar con errores (I4): role="alert" lo
                  anuncia al insertarse. Se oculta en cuanto el formulario está
                  completo, para no quedar obsoleto. Monocromo y centrado. */}
              {resumenError && !listo && (
                <p
                  role="alert"
                  className="text-center text-small font-medium text-black"
                >
                  {resumenError}
                </p>
              )}

              {/* Remate al 100%: cuando los 5 campos son válidos, el botón
                  muestra un check discreto (cambio de estado sobrio). El botón
                  ocupa el ancho del pie, como una app bancaria. */}
              <button
                type="submit"
                ref={rippleRef}
                onPointerDown={onRipplePointerDown}
                onKeyDown={onRippleKeyDown}
                disabled={enviando}
                className={btn({
                  variant: "primary",
                  size: "lg",
                  className: "relative isolate w-full overflow-hidden",
                })}
              >
                {enviando ? (
                  "Enviando…"
                ) : (
                  <>
                    {listo && <CheckGlyph />}
                    Solicitar presupuesto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
