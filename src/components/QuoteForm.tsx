"use client";

import { useEffect, useRef, useState } from "react";
import { useQuote } from "./QuoteContext";

const TAMANOS = ["Estudio", "Piso pequeño", "Piso mediano", "Piso grande", "Casa"];

const labelClass = "block text-sm font-medium text-black";
const fieldClass =
  "mt-2 w-full rounded-lg bg-gris px-4 py-3 text-base text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";

export default function QuoteForm() {
  const { prefill } = useQuote();
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
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencias en orden para enfocar el primer campo vacío tras el prefill.
  const refs = {
    origen: useRef<HTMLInputElement>(null),
    destino: useRef<HTMLInputElement>(null),
    tamano: useRef<HTMLSelectElement>(null),
    fecha: useRef<HTMLInputElement>(null),
    nombre: useRef<HTMLInputElement>(null),
    telefono: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
  };

  // Cuando el hero pulsa "Calcular presupuesto": rellena, hace scroll y enfoca.
  useEffect(() => {
    if (prefill.nonce === 0) return;

    const next = {
      origen: prefill.origen,
      destino: prefill.destino,
    };
    setForm((prev) => ({ ...prev, ...next }));

    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Enfoca el primer campo vacío una vez actualizado el estado.
    requestAnimationFrame(() => {
      const merged = { ...form, ...next };
      const order: (keyof typeof refs)[] = [
        "origen",
        "destino",
        "tamano",
        "fecha",
        "nombre",
        "telefono",
        "email",
      ];
      for (const key of order) {
        if (!String(merged[key] ?? "").trim()) {
          refs[key].current?.focus();
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
      setEnviado(true);
    } catch {
      setError(
        "No se pudo enviar la solicitud. Revisa los datos e inténtalo de nuevo."
      );
    } finally {
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

        {enviado ? (
          <p className="mt-10 text-lg leading-[1.6] text-black">
            Solicitud recibida. Te contactamos hoy mismo para cerrar tu
            presupuesto.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
            <div>
              <label htmlFor="origen" className={labelClass}>
                Origen
              </label>
              <input
                id="origen"
                ref={refs.origen}
                type="text"
                value={form.origen}
                onChange={update("origen")}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="destino" className={labelClass}>
                Destino
              </label>
              <input
                id="destino"
                ref={refs.destino}
                type="text"
                value={form.destino}
                onChange={update("destino")}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="tamano" className={labelClass}>
                Tamaño aproximado
              </label>
              <select
                id="tamano"
                ref={refs.tamano}
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
                ref={refs.fecha}
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
                ref={refs.nombre}
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
                ref={refs.telefono}
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
                ref={refs.email}
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
        )}
      </div>
    </section>
  );
}
