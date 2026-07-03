"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_COMERCIALES, TAMANOS_VIVIENDA } from "@/lib/leads";
import {
  Card,
  Text,
  Check,
  fieldClass,
  labelClass,
} from "@/components/admin/LeadFields";
import {
  esTelefonoEsValido,
  esEmailValido,
  AVISO_TELEFONO,
  AVISO_EMAIL,
} from "@/lib/validaciones";
import { crearLead, type CrearLeadInput } from "./actions";

const INICIAL: CrearLeadInput = {
  nombre: "",
  telefono: "",
  email: "",
  origen_direccion: "",
  origen_planta: "",
  origen_ascensor: false,
  destino_direccion: "",
  destino_planta: "",
  destino_ascensor: false,
  fecha_deseada: "",
  tamano_aprox: "",
  estado_comercial: "Nuevo",
  notas: "",
};

// Alta manual de un lead (ficha completa) para clientes que llaman por teléfono.
// Al guardar, redirige a la ficha del nuevo lead para poder presupuestarlo.
export default function NuevoLeadForm() {
  const router = useRouter();
  const [f, setF] = useState<CrearLeadInput>(INICIAL);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  function set<K extends keyof CrearLeadInput>(key: K, value: CrearLeadInput[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  // Teléfono obligatorio y válido; email opcional pero válido si se rellena.
  const validarTelefono = (v: string) =>
    esTelefonoEsValido(v) ? null : AVISO_TELEFONO;
  const validarEmail = (v: string) =>
    v.trim() === "" || esEmailValido(v) ? null : AVISO_EMAIL;

  const puedeGuardar =
    f.nombre.trim().length > 0 && f.telefono.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const telErr = validarTelefono(f.telefono);
    const emErr = validarEmail(f.email);
    setTelefonoError(telErr);
    setEmailError(emErr);
    if (telErr || emErr) return;
    setError(null);
    startTransition(async () => {
      const res = await crearLead(f);
      if (res.ok) {
        router.push(`/admin/leads/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Contacto">
          <Text label="Nombre" value={f.nombre} onChange={(v) => set("nombre", v)} />
          <Text
            label="Teléfono"
            type="tel"
            value={f.telefono}
            onChange={(v) => {
              set("telefono", v);
              if (telefonoError && esTelefonoEsValido(v)) setTelefonoError(null);
            }}
            onBlur={() =>
              setTelefonoError(
                f.telefono.trim() ? validarTelefono(f.telefono) : null
              )
            }
            error={telefonoError}
          />
          <Text
            label="Email (opcional)"
            type="email"
            value={f.email}
            onChange={(v) => {
              set("email", v);
              if (emailError && validarEmail(v) === null) setEmailError(null);
            }}
            onBlur={() => setEmailError(validarEmail(f.email))}
            error={emailError}
          />
        </Card>

        <Card title="Detalles">
          <div>
            <label htmlFor="fecha_deseada" className={labelClass}>
              Fecha deseada
            </label>
            <input
              id="fecha_deseada"
              type="date"
              value={f.fecha_deseada}
              onChange={(e) => set("fecha_deseada", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="tamano_aprox" className={labelClass}>
              Tamaño aproximado
            </label>
            <select
              id="tamano_aprox"
              value={f.tamano_aprox}
              onChange={(e) => set("tamano_aprox", e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              <option value="">Sin especificar</option>
              {TAMANOS_VIVIENDA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card title="Origen">
          <Text
            label="Dirección"
            value={f.origen_direccion}
            onChange={(v) => set("origen_direccion", v)}
          />
          <Text
            label="Planta"
            value={f.origen_planta}
            onChange={(v) => set("origen_planta", v)}
          />
          <Check
            label="Ascensor en origen"
            checked={f.origen_ascensor}
            onChange={(v) => set("origen_ascensor", v)}
          />
        </Card>

        <Card title="Destino">
          <Text
            label="Dirección"
            value={f.destino_direccion}
            onChange={(v) => set("destino_direccion", v)}
          />
          <Text
            label="Planta"
            value={f.destino_planta}
            onChange={(v) => set("destino_planta", v)}
          />
          <Check
            label="Ascensor en destino"
            checked={f.destino_ascensor}
            onChange={(v) => set("destino_ascensor", v)}
          />
        </Card>

        <Card title="Gestión">
          <div>
            <label htmlFor="estado_comercial" className={labelClass}>
              Estado comercial
            </label>
            <select
              id="estado_comercial"
              value={f.estado_comercial}
              onChange={(e) => set("estado_comercial", e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              {ESTADOS_COMERCIALES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notas" className={labelClass}>
              Notas internas
            </label>
            <textarea
              id="notas"
              value={f.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={5}
              placeholder="Anotaciones del equipo sobre este cliente…"
              className={`${fieldClass} resize-y`}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || !puedeGuardar}
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85 disabled:opacity-40"
        >
          {pending ? "Creando…" : "Crear lead"}
        </button>
        {error && (
          <span role="status" className="text-sm text-red-600">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
