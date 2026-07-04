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

// Campo base: gris muy claro, redondeado, borde que se marca al enfocar.
const fieldClass =
  "w-full rounded-lg bg-gris px-4 py-3 text-base text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";
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

  // Validación del número de calle (Google Places). Si Google no está
  // disponible, no se exige (degradación) para no bloquear el envío.
  const { failed: mapsFailed } = usePlaces();
  const [origenNum, setOrigenNum] = useState(false);
  const [destinoNum, setDestinoNum] = useState(false);
  const [intentado, setIntentado] = useState(false);

  // Errores de contacto (teléfono y email) mostrados junto a cada campo.
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

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

  // Cuando el hero pulsa "Calcular presupuesto": rellena, hace scroll y enfoca.
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

    // Teléfono y email deben ser válidos para poder contactar al cliente.
    const telErr = validarTelefono(form.telefono);
    const emErr = validarEmail(form.email);
    setTelefonoError(telErr);
    setEmailError(emErr);

    // La dirección de origen y destino debe incluir número de calle.
    if ((exigirNumero && (!origenNum || !destinoNum)) || telErr || emErr) {
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      // Se guarda el teléfono completo con prefijo (+34 + 9 dígitos).
      const payload = { ...form, telefono: `+34 ${form.telefono}` };
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
    }
  };

  return (
    <section
      id="presupuesto"
      ref={sectionRef}
      className="w-full border-t border-black/10 scroll-mt-24"
    >
      <div className="mx-auto max-w-[560px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Pide tu presupuesto
        </h2>

        {/* Tarjeta contenedora del formulario. */}
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.05)] sm:p-6 md:mt-10 md:p-8">
          {/* Encabezado del formulario dentro de la tarjeta. */}
          <div className="mb-5 md:mb-6">
            <h3 className="text-xl font-medium tracking-tight text-black">
              Te llamamos
            </h3>
            <p className="mt-1 text-[14px] leading-[1.5] text-black/60">
              Déjanos tus datos y te preparamos el presupuesto.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
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
                {intentado && faltaOrigenNum && (
                  <p className={`${errorClass} text-amber-700`}>
                    Indica el número de la calle.
                  </p>
                )}
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
                {intentado && faltaDestinoNum && (
                  <p className={`${errorClass} text-amber-700`}>
                    Indica el número de la calle.
                  </p>
                )}
              </div>

              {/* Nombre */}
              <input
                id="nombre"
                ref={nombreRef}
                type="text"
                value={form.nombre}
                onChange={update("nombre")}
                required
                aria-label="Nombre y apellidos"
                placeholder="Nombre y apellidos"
                className={fieldClass}
              />

              {/* Teléfono (con +34 fijo) + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-stretch overflow-hidden rounded-lg border border-transparent bg-gris transition-colors duration-150 focus-within:border-black">
                    <span className="flex select-none items-center border-r border-black/10 pl-4 pr-3 text-base text-black/50">
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
                    <p className={`${errorClass} text-red-600`} role="alert">
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
                    <p className={`${errorClass} text-red-600`} role="alert">
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
                onChange={update("acepta")}
                required
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

            {error && (
              <p className="mt-4 text-[15px] text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-5 w-full rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors duration-150 hover:bg-black/85 disabled:opacity-50"
            >
              {enviando ? "Enviando…" : "Presupuesto"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
