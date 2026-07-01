"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  margenAjustado,
  round2,
  type ObjetoBusqueda,
  type PresupuestoResultado,
} from "@/lib/presupuesto";
import { formatPrecio } from "@/lib/leads";
import {
  buscarObjetos,
  calcularPresupuestoAction,
  guardarPresupuestoAction,
} from "./presupuestoActions";

const fieldClass =
  "w-full rounded-lg bg-gris px-3 py-2 text-sm text-black placeholder-black/40 outline-none border border-transparent transition-colors focus:border-black";
const labelClass = "block text-xs font-medium text-black/60";

type LineaUI = { objeto: ObjetoBusqueda; cantidad: number };

export type AccesosDefault = {
  origen_planta: number;
  origen_ascensor: boolean;
  destino_planta: number;
  destino_ascensor: boolean;
};

function n(value: string): number {
  const x = Number(value.replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export default function PresupuestoForm({
  leadId,
  accesosDefault,
}: {
  leadId: string;
  accesosDefault: AccesosDefault;
}) {
  const router = useRouter();

  // Selección de objetos
  const [query, setQuery] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ObjetoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [lineas, setLineas] = useState<LineaUI[]>([]);

  // Accesos y distancia
  const [kmIda, setKmIda] = useState("");
  const [origenPlanta, setOrigenPlanta] = useState(String(accesosDefault.origen_planta));
  const [origenAscensor, setOrigenAscensor] = useState(accesosDefault.origen_ascensor);
  const [destinoPlanta, setDestinoPlanta] = useState(String(accesosDefault.destino_planta));
  const [destinoAscensor, setDestinoAscensor] = useState(accesosDefault.destino_ascensor);
  const [accesoDificil, setAccesoDificil] = useState(false);
  const [urgencia, setUrgencia] = useState(false);
  const [permisos, setPermisos] = useState("0");

  // Resultado
  const [resultado, setResultado] = useState<PresupuestoResultado | null>(null);
  const [precioAjustado, setPrecioAjustado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [calculando, startCalculo] = useTransition();
  const [guardando, startGuardado] = useTransition();

  // --- Buscador con debounce ---
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      const res = await buscarObjetos(query);
      setResultadosBusqueda(res);
      setBuscando(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function anadir(objeto: ObjetoBusqueda) {
    setLineas((prev) => {
      const i = prev.findIndex((l) => String(l.objeto.id) === String(objeto.id));
      if (i >= 0) {
        const copia = [...prev];
        copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 };
        return copia;
      }
      return [...prev, { objeto, cantidad: 1 }];
    });
    invalidar();
  }

  function cambiarCantidad(id: string | number, cantidad: number) {
    setLineas((prev) =>
      prev.map((l) =>
        String(l.objeto.id) === String(id)
          ? { ...l, cantidad: Math.max(1, cantidad) }
          : l
      )
    );
    invalidar();
  }

  function quitar(id: string | number) {
    setLineas((prev) => prev.filter((l) => String(l.objeto.id) !== String(id)));
    invalidar();
  }

  // Cualquier cambio de entrada invalida el resultado previo.
  function invalidar() {
    setResultado(null);
    setGuardado(false);
  }

  const accesosPayload = () => ({
    km_ida: n(kmIda),
    origen_planta: Math.floor(n(origenPlanta)),
    origen_ascensor: origenAscensor,
    destino_planta: Math.floor(n(destinoPlanta)),
    destino_ascensor: destinoAscensor,
    acceso_dificil: accesoDificil,
    urgencia,
    permisos: Math.max(0, Math.floor(n(permisos))),
  });

  function calcular() {
    setError(null);
    setGuardado(false);
    if (lineas.length === 0) {
      setError("Añade al menos un objeto al presupuesto.");
      return;
    }
    startCalculo(async () => {
      const res = await calcularPresupuestoAction({
        lineas: lineas.map((l) => ({ id: l.objeto.id, cantidad: l.cantidad })),
        accesos: accesosPayload(),
      });
      if (res.ok) {
        setResultado(res.resultado);
        setPrecioAjustado(round2(res.resultado.precio_final).toFixed(2));
      } else {
        setError(res.error);
        setResultado(null);
      }
    });
  }

  function guardar() {
    if (!resultado) return;
    setError(null);
    startGuardado(async () => {
      const parsed = n(precioAjustado);
      const res = await guardarPresupuestoAction({
        leadId,
        lineas: lineas.map((l) => ({ id: l.objeto.id, cantidad: l.cantidad })),
        accesos: accesosPayload(),
        precioFinalAjustado: parsed > 0 ? round2(parsed) : null,
      });
      if (res.ok) {
        setGuardado(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  // --- Margen en vivo del precio ajustado ---
  const ivaRate = resultado && resultado.subtotal_con_margen > 0
    ? resultado.iva_eur / resultado.subtotal_con_margen
    : 0;
  const ajuste = useMemo(() => {
    if (!resultado) return null;
    return margenAjustado(n(precioAjustado), resultado.coste_base, ivaRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioAjustado, resultado, ivaRate]);

  // Agrupar resultados de búsqueda por sala.
  const porSala = useMemo(() => {
    const grupos = new Map<string, ObjetoBusqueda[]>();
    for (const o of resultadosBusqueda) {
      const key = o.sala?.trim() || "Otros";
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(o);
    }
    return [...grupos.entries()];
  }, [resultadosBusqueda]);

  return (
    <div className="flex flex-col gap-6">
      {/* --- Selector de objetos --- */}
      <div>
        <label htmlFor="buscar-objeto" className={labelClass}>
          Objetos del inventario
        </label>
        <input
          id="buscar-objeto"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar objeto (ej. sofá, armario, caja)…"
          className={`mt-2 ${fieldClass}`}
        />

        {query.trim().length >= 2 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-black/10">
            {buscando && (
              <p className="px-3 py-2 text-sm text-black/50">Buscando…</p>
            )}
            {!buscando && resultadosBusqueda.length === 0 && (
              <p className="px-3 py-2 text-sm text-black/50">Sin resultados.</p>
            )}
            {porSala.map(([sala, objetos]) => (
              <div key={sala}>
                <p className="bg-gris px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-black/50">
                  {sala}
                </p>
                {objetos.map((o) => (
                  <button
                    key={String(o.id)}
                    type="button"
                    onClick={() => anadir(o)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gris"
                  >
                    <span>{o.objeto}</span>
                    <span className="text-xs text-black/50">
                      {o.volumen_m3} m³ · Añadir +
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Lista de objetos añadidos */}
        {lineas.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {lineas.map((l) => (
              <div
                key={String(l.objeto.id)}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {l.objeto.objeto}
                  <span className="ml-2 text-xs text-black/40">
                    {l.objeto.volumen_m3} m³
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <Stepper
                    onDec={() => cambiarCantidad(l.objeto.id, l.cantidad - 1)}
                    onInc={() => cambiarCantidad(l.objeto.id, l.cantidad + 1)}
                    value={l.cantidad}
                    onChange={(v) => cambiarCantidad(l.objeto.id, v)}
                  />
                  <button
                    type="button"
                    onClick={() => quitar(l.objeto.id)}
                    className="ml-1 rounded px-2 py-1 text-xs text-black/50 hover:bg-gris hover:text-black"
                    aria-label={`Quitar ${l.objeto.objeto}`}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Distancia y accesos --- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="km" className={labelClass}>
            Kilómetros de ida (origen → destino)
          </label>
          <input
            id="km"
            type="number"
            min={0}
            value={kmIda}
            onChange={(e) => {
              setKmIda(e.target.value);
              invalidar();
            }}
            placeholder="0"
            className={`mt-2 ${fieldClass}`}
          />
        </div>

        <div>
          <label htmlFor="op" className={labelClass}>
            Planta origen
          </label>
          <input
            id="op"
            type="number"
            value={origenPlanta}
            onChange={(e) => {
              setOrigenPlanta(e.target.value);
              invalidar();
            }}
            className={`mt-2 ${fieldClass}`}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={origenAscensor}
            onChange={(e) => {
              setOrigenAscensor(e.target.checked);
              invalidar();
            }}
            className="h-4 w-4 accent-black"
          />
          Ascensor en origen
        </label>

        <div>
          <label htmlFor="dp" className={labelClass}>
            Planta destino
          </label>
          <input
            id="dp"
            type="number"
            value={destinoPlanta}
            onChange={(e) => {
              setDestinoPlanta(e.target.value);
              invalidar();
            }}
            className={`mt-2 ${fieldClass}`}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={destinoAscensor}
            onChange={(e) => {
              setDestinoAscensor(e.target.checked);
              invalidar();
            }}
            className="h-4 w-4 accent-black"
          />
          Ascensor en destino
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={accesoDificil}
            onChange={(e) => {
              setAccesoDificil(e.target.checked);
              invalidar();
            }}
            className="h-4 w-4 accent-black"
          />
          Acceso difícil
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={urgencia}
            onChange={(e) => {
              setUrgencia(e.target.checked);
              invalidar();
            }}
            className="h-4 w-4 accent-black"
          />
          Urgencia
        </label>

        <div className="col-span-2">
          <label htmlFor="permisos" className={labelClass}>
            Permisos de estacionamiento necesarios
          </label>
          <input
            id="permisos"
            type="number"
            min={0}
            value={permisos}
            onChange={(e) => {
              setPermisos(e.target.value);
              invalidar();
            }}
            className={`mt-2 ${fieldClass}`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={calcular}
        disabled={calculando}
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-40"
      >
        {calculando ? "Calculando…" : "Calcular"}
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* --- Resultado --- */}
      {resultado && (
        <Resultado
          r={resultado}
          precioAjustado={precioAjustado}
          setPrecioAjustado={(v) => {
            setPrecioAjustado(v);
            setGuardado(false);
          }}
          ajuste={ajuste}
          onGuardar={guardar}
          guardando={guardando}
          guardado={guardado}
        />
      )}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  onInc,
  onDec,
}: {
  value: number;
  onChange: (v: number) => void;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-black/15">
      <button
        type="button"
        onClick={onDec}
        className="px-2 py-1 text-sm hover:bg-gris"
        aria-label="Menos"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className="w-12 border-x border-black/15 bg-white px-1 py-1 text-center text-sm outline-none"
      />
      <button
        type="button"
        onClick={onInc}
        className="px-2 py-1 text-sm hover:bg-gris"
        aria-label="Más"
      >
        +
      </button>
    </div>
  );
}

function Linea({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-black/60">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Resultado({
  r,
  precioAjustado,
  setPrecioAjustado,
  ajuste,
  onGuardar,
  guardando,
  guardado,
}: {
  r: PresupuestoResultado;
  precioAjustado: string;
  setPrecioAjustado: (v: string) => void;
  ajuste: ReturnType<typeof margenAjustado> | null;
  onGuardar: () => void;
  guardando: boolean;
  guardado: boolean;
}) {
  const num = (x: number, d = 2) =>
    x.toLocaleString("es-ES", { maximumFractionDigits: d });

  return (
    <div className="rounded-lg border border-black/10 bg-gris/40 p-4">
      {/* Resumen operativo */}
      <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
        <Dato label="Volumen" value={`${num(r.volumen_total_m3, 2)} m³`} />
        <Dato
          label="Vehículo"
          value={r.viajes > 1 ? `${r.vehiculo} ×${r.viajes}` : r.vehiculo}
        />
        <Dato label="Operarios" value={String(r.operarios)} />
        <Dato label="Días" value={String(r.dias)} />
      </div>
      <p className="mt-2 text-xs text-black/50">
        Horas estimadas: {num(r.horas_totales, 1)} h (manejo {num(r.horas_manejo, 1)} ·
        desmontaje {num(r.horas_desmontaje, 1)} · trayecto {num(r.horas_trayecto, 1)} +
        buffer) · {num(r.km_totales, 0)} km totales
      </p>

      {/* Desglose de costes */}
      <div className="mt-4 border-t border-black/10 pt-3">
        <Linea label="Vehículo" value={formatPrecio(round2(r.coste_vehiculo))} />
        <Linea label="Distancia" value={formatPrecio(round2(r.coste_distancia))} />
        <Linea label="Personal" value={formatPrecio(round2(r.coste_personal))} />
        <Linea label="Embalaje" value={formatPrecio(round2(r.coste_embalaje))} />
        <Linea label="Extras (accesos)" value={formatPrecio(round2(r.coste_extras))} />
        {r.recargo_urgencia_eur > 0 && (
          <Linea
            label="Recargo urgencia"
            value={formatPrecio(round2(r.recargo_urgencia_eur))}
          />
        )}
        <div className="mt-1 border-t border-black/10 pt-1">
          <Linea label="Coste base" value={formatPrecio(round2(r.coste_base))} />
        </div>
        <Linea label="Margen" value={formatPrecio(round2(r.margen_eur))} />
        <Linea label="IVA" value={formatPrecio(round2(r.iva_eur))} />
      </div>

      {/* Precio final destacado */}
      <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-3">
        <span className="text-sm font-medium">Precio final</span>
        <span className="text-2xl font-semibold tabular-nums">
          {formatPrecio(round2(r.precio_final))}
        </span>
      </div>

      {/* Ajuste manual */}
      <div className="mt-4 rounded-lg border border-black/10 bg-white p-3">
        <label htmlFor="ajustado" className="block text-xs font-medium text-black/60">
          Precio final ajustado (negociación)
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="ajustado"
            type="number"
            min={0}
            step="0.01"
            value={precioAjustado}
            onChange={(e) => setPrecioAjustado(e.target.value)}
            className="w-40 rounded-lg bg-gris px-3 py-2 text-sm tabular-nums outline-none border border-transparent focus:border-black"
          />
          <span className="text-sm text-black/50">€ (IVA incluido)</span>
        </div>

        {ajuste && (
          <div className="mt-3 text-sm">
            <p>
              Margen real:{" "}
              <span className="font-medium tabular-nums">
                {formatPrecio(round2(ajuste.margen_eur))} (
                {num(ajuste.margen_pct, 1)}%)
              </span>
            </p>
            {ajuste.bajo_coste ? (
              <p className="mt-1 rounded-md bg-red-600 px-3 py-2 font-semibold text-white">
                ⚠ Por debajo del coste base: vender a este precio da PÉRDIDAS.
              </p>
            ) : ajuste.bajo_minimo ? (
              <p className="mt-1 rounded-md border border-red-600 px-3 py-2 font-medium text-red-600">
                ⚠ Margen por debajo del 10%. Revisa antes de cerrar.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar presupuesto"}
        </button>
        {guardado && (
          <span className="text-sm text-black/60" role="status">
            Presupuesto guardado (borrador).
          </span>
        )}
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
