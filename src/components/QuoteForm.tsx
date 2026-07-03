"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuote } from "./QuoteContext";
import AddressAutocomplete from "./AddressAutocomplete";
import { usePlaces } from "@/lib/googleMaps";

const TAMANOS = ["Estudio", "Piso pequeño", "Piso mediano", "Piso grande", "Casa"];

const labelClass = "block text-sm font-medium text-black";
const fieldClass =
  "mt-2 w-full rounded-lg bg-gris px-4 py-3 text-base text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";

export default function QuoteForm() {
  const { prefill } = useQuote();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

  const [form, setForm] = useState({
    origen: "",
    destino: "",
    tamano: "",
    fecha: "",
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
  const exigirNumero = !mapsFailed;
  const faltaOrigenNum =
    exigirNumero && form.origen.trim() !== "" && !origenNum;
  const faltaDestinoNum =
    exigirNumero && form.destino.trim() !== "" && !destinoNum;

  // Referencias en orden para enfocar el primer campo vacío tras el prefill.
  const origenRef = useRef<HTMLInputElement>(null);
  const destinoRef = useRef<HTMLInputElement>(null);
  const tamanoRef = useRef<HTMLSelectElement>(null);
  const fechaRef = useRef<HTMLInputElement>(null);
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
        { valor: merged.tamano, enfocar: () => tamanoRef.current?.focus() },
        { valor: merged.fecha, enfocar: () => fechaRef.current?.focus() },
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
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >
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
    // La dirección de origen y destino debe incluir número de calle.
    if (exigirNumero && (!origenNum || !destinoNum)) {
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="mx-auto max-w-[640px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Pide tu presupuesto
        </h2>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
            <div>
              <label htmlFor="origen" className={labelClass}>
                Origen
              </label>
              <AddressAutocomplete
                id="origen"
                inputRef={origenRef}
                value={form.origen}
                onChange={(v, hasNumber) => {
                  setForm((prev) => ({ ...prev, origen: v }));
                  setOrigenNum(hasNumber);
                }}
                required
                className={fieldClass}
              />
              {intentado && faltaOrigenNum && (
                <p className="mt-2 text-[13px] font-medium text-amber-700">
                  Indica el número de la calle.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="destino" className={labelClass}>
                Destino
              </label>
              <AddressAutocomplete
                id="destino"
                inputRef={destinoRef}
                value={form.destino}
                onChange={(v, hasNumber) => {
                  setForm((prev) => ({ ...prev, destino: v }));
                  setDestinoNum(hasNumber);
                }}
                required
                className={fieldClass}
              />
              {intentado && faltaDestinoNum && (
                <p className="mt-2 text-[13px] font-medium text-amber-700">
                  Indica el número de la calle.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="tamano" className={labelClass}>
                Tamaño aproximado
              </label>
              <select
                id="tamano"
                ref={tamanoRef}
                value={form.tamano}
                onChange={update("tamano")}
                required
                className={`${fieldClass} appearance-none`}
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {TAMANOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fecha" className={labelClass}>
                Fecha deseada
              </label>
              <input
                id="fecha"
                ref={fechaRef}
                type="date"
                value={form.fecha}
                onChange={update("fecha")}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="nombre" className={labelClass}>
                Nombre
              </label>
              <input
                id="nombre"
                ref={nombreRef}
                type="text"
                value={form.nombre}
                onChange={update("nombre")}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="telefono" className={labelClass}>
                Teléfono
              </label>
              <input
                id="telefono"
                ref={telefonoRef}
                type="tel"
                value={form.telefono}
                onChange={update("telefono")}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                ref={emailRef}
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                className={fieldClass}
              />
            </div>

            <label className="flex items-start gap-3 text-[15px] leading-[1.5] text-black/70">
              <input
                type="checkbox"
                checked={form.acepta}
                onChange={update("acepta")}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-black"
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
              <p className="text-[15px] text-black" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 w-full rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors duration-150 hover:bg-black/85 disabled:opacity-50"
            >
              {enviando ? "Enviando…" : "Solicitar presupuesto"}
            </button>
        </form>
      </div>
    </section>
  );
}
