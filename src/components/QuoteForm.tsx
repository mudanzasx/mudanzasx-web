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
import { field } from "@/components/ui/field";
import { Clock } from "lucide-react";
import Turnstile, { type TurnstileHandle } from "./Turnstile";

// Campo base dentro de la tarjeta: fondo blanco, borde sutil que se marca al
// enfocar. `pr-11` reserva sitio a la derecha para la marca de validación, así
// no hay salto de layout cuando el check aparece.
const fieldClass = field({ variant: "public", size: "lg", className: "pr-11" });
const errorClass = "mt-1.5 text-[13px] font-medium";

// Ondas de marca del fondo de la sección (detrás de la tarjeta): 10 arcos
// concéntricos negros con el mismo centro, espaciado geométrico (×1,35) y
// opacidad interpolada 0.24 → 0.02. Reforzadas para que se perciban a través
// del vidrio; los arcos interiores (los más marcados) cruzan por detrás de la
// tarjeta y se atenúan hacia los bordes de la sección de forma natural.
const ONDA_ARCOS = Array.from({ length: 10 }, (_, i) => ({
  r: Math.round(70 * Math.pow(1.35, i)),
  opacity: Math.round((0.24 - (0.22 * i) / 9) * 1000) / 1000,
}));

// Marca de validación discreta dentro del campo (derecha): check de trazo fino
// en negro (nunca verde; paleta estricta). Aparece/desaparece con una
// transición breve; se anula con prefers-reduced-motion.
function CheckMark({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black transition-all duration-200 ease-out motion-reduce:transition-none ${
        show ? "scale-100 opacity-100" : "scale-90 opacity-0"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4 4 10-11" />
      </svg>
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

  // Cloudflare Turnstile (captcha). Activo solo si hay site key configurada.
  const turnstileHabilitado = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
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

  // Validez por campo (en vivo) para la barra de progreso y las marcas de
  // validación. Un campo de dirección es válido si tiene texto y número de
  // calle (o si Google no está disponible y no se exige número).
  const origenOk = form.origen.trim() !== "" && (origenNum || !exigirNumero);
  const destinoOk = form.destino.trim() !== "" && (destinoNum || !exigirNumero);
  const nombreOk = form.nombre.trim() !== "";
  const telefonoOk = esTelefonoEsValido(form.telefono);
  const emailOk = esEmailValido(form.email);
  // 5 campos obligatorios = 5 tramos de la barra.
  const completos =
    Number(origenOk) +
    Number(destinoOk) +
    Number(nombreOk) +
    Number(telefonoOk) +
    Number(emailOk);
  const listo = completos === 5;

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

    // La dirección de origen y destino es obligatoria y debe incluir número.
    if (
      origenVacio ||
      destinoVacio ||
      (exigirNumero && (!origenNum || !destinoNum)) ||
      telErr ||
      emErr ||
      nomErr ||
      aceptaErr
    ) {
      return;
    }

    // Verificación de seguridad: si el widget aún no ha resuelto el desafío, no
    // se envía (el servidor también lo rechazaría).
    if (turnstileHabilitado && !turnstileToken) {
      setTurnstileError(
        "Verificación de seguridad pendiente. Espera un momento e inténtalo de nuevo."
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
      // Redirige a la página propia de confirmación (URL medible).
      router.push("/solicitud-recibida");
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
      {/* Ondas de marca detrás de la tarjeta: estáticas, monocromas, sin
          capturar clics. Origen en el centro de la sección (tras la tarjeta),
          arcos que se salen del encuadre; overflow-hidden de la sección los
          recorta en los bordes. El trazo se mantiene fino y constante. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        {ONDA_ARCOS.map((a, i) => (
          <circle
            key={i}
            cx={500}
            cy={500}
            r={a.r}
            fill="none"
            stroke="#000000"
            strokeOpacity={a.opacity}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="relative z-10 mx-auto max-w-[460px] px-6 py-14 md:py-24">
        {/* Tarjeta tipo panel de login con vidrio esmerilado sutil: fondo
            blanco traslúcido + desenfoque del fondo (ondas), hairline y sombra
            única. La clase mx-glass-card gestiona el fallback a blanco sólido y
            prefers-reduced-transparency. Los campos y textos van sólidos. */}
        <div className="mx-glass-card relative overflow-hidden rounded-card border border-hairline">
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
              style={{ transform: `scaleX(${completos / 5})` }}
            />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Cuerpo traslúcido: cabecera y campos sobre el vidrio. */}
            <div className="p-6 md:p-8">
              {/* Cabecera: titular corto + badge del tiempo estimado. Sin párrafo. */}
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-2xl font-medium leading-tight tracking-[-0.02em] text-black">
                  Te llamamos
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-gris px-2.5 py-1 text-xs font-medium text-black">
                  <Clock size={14} strokeWidth={1.5} />
                  10 min
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Origen */}
                <div>
                  <div className="relative">
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
                      className={fieldClass}
                    />
                    <CheckMark show={origenOk} />
                  </div>
                  {intentado && form.origen.trim() === "" ? (
                    <p className={`${errorClass} text-black`}>
                      Indica la dirección de origen.
                    </p>
                  ) : intentado && faltaOrigenNum ? (
                    <p className={`${errorClass} text-black`}>
                      Indica el número de la calle.
                    </p>
                  ) : null}
                </div>

                {/* Destino */}
                <div>
                  <div className="relative">
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
                      className={fieldClass}
                    />
                    <CheckMark show={destinoOk} />
                  </div>
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

              <label className="mt-5 flex items-start gap-3 text-[14px] leading-[1.5] text-black/70">
                <input
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

            {/* Pie sólido anclado (zona de acción): blanco puro, sin vidrio ni
                transparencia; separado del cuerpo por una hairline y siguiendo el
                radio inferior de la tarjeta (overflow-hidden del contenedor). El
                ojo cae de forma natural aquí. Contiene Turnstile y el botón. */}
            <div className="flex flex-col gap-4 border-t border-hairline bg-white px-6 py-5 md:px-8 md:py-6">
              {turnstileHabilitado && (
                <div>
                  <Turnstile
                    ref={turnstileRef}
                    onToken={(t) => {
                      setTurnstileToken(t);
                      setTurnstileError(null);
                    }}
                    onError={() => {
                      setTurnstileToken(null);
                      setTurnstileError(
                        "No se pudo cargar la verificación de seguridad. Recarga la página e inténtalo de nuevo."
                      );
                    }}
                  />
                  {turnstileError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {turnstileError}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-[15px] font-medium text-black" role="alert">
                  {error}
                </p>
              )}

              {/* Remate al 100%: cuando los 5 campos son válidos, el botón
                  muestra un check discreto (cambio de estado sobrio). El botón
                  ocupa el ancho del pie, como una app bancaria. */}
              <button
                type="submit"
                disabled={enviando}
                className={btn({
                  variant: "primary",
                  size: "lg",
                  className: "w-full",
                })}
              >
                {enviando ? (
                  "Enviando…"
                ) : (
                  <>
                    {listo && (
                      <svg
                        width="18"
                        height="18"
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
                    )}
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
