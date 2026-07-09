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
import Turnstile, { type TurnstileHandle } from "./Turnstile";

// Campo base: fondo blanco sobre la sección gris (el formulario ya no vive
// dentro de una tarjeta), con borde sutil que se marca al enfocar.
const fieldClass = field({ variant: "public", size: "lg" });
const errorClass = "mt-1.5 text-[13px] font-medium";

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
      className="w-full border-t border-hairline bg-gris"
    >
      <div className="mx-auto max-w-[560px] px-6 py-14 md:py-24">
        {/* El formulario ocupa la sección directamente (sin tarjeta): inputs
            blancos sobre el fondo gris de la sección. */}
        <h2 className="mb-5 text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black md:mb-6">
          Diseñamos tu mudanza en una llamada de 10 minutos
        </h2>
        <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4">
              {/* Origen */}
              <div>
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
                {nombreError && (
                  <p className={`${errorClass} text-black`} role="alert">
                    {nombreError}
                  </p>
                )}
              </div>

              {/* Teléfono (con +34 fijo) + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-stretch overflow-hidden rounded-field border border-hairline bg-white transition-colors duration-150 focus-within:border-black">
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
                      className="w-full min-w-0 bg-transparent py-3 pl-3 pr-4 text-base text-black placeholder-black/40 outline-none"
                    />
                  </div>
                  {telefonoError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {telefonoError}
                    </p>
                  )}
                </div>

                <div>
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
                  {emailError && (
                    <p className={`${errorClass} text-black`} role="alert">
                      {emailError}
                    </p>
                  )}
                </div>
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

            {turnstileHabilitado && (
              <div className="mt-5">
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
              <p className="mt-4 text-[15px] font-medium text-black" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className={btn({
                variant: "primary",
                size: "lg",
                className: "mt-5 w-full",
              })}
            >
              {enviando ? "Enviando…" : "Solicitar presupuesto"}
            </button>
          </form>
      </div>
    </section>
  );
}
