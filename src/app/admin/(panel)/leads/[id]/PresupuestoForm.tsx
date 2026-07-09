"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  interruptoresPorDefecto,
  margenAjustado,
  round2,
  type AccesosInput,
  type Interruptores,
  type ObjetoBusqueda,
  type ObjetoLinea,
  type PresupuestoResultado,
  type ProductoBusqueda,
  type ProductoLinea,
} from "@/lib/presupuesto";
import { formatPrecio, parsePlantaNum } from "@/lib/leads";
import { btn } from "@/components/ui/button";
import { field } from "@/components/ui/field";
import {
  buscarObjetos,
  buscarProductos,
  calcularPresupuestoAction,
  guardarPresupuestoAction,
} from "./presupuestoActions";

const fieldClass = field({ size: "sm" });
const labelClass = "block text-xs font-medium text-black/60";

type ObjLineaUI = {
  id: string | number;
  objeto: string;
  sala: string | null;
  volumen_m3: number;
  cantidad: number;
  sw: Interruptores;
};
type ProdLineaUI = {
  id: string | number;
  nombre: string;
  volumen_m3: number;
  coste_unitario: number;
  cantidad: number;
};

export type ResumenPresupuesto = {
  volumen_neto_m3: number;
  volumen_real_ocupado_m3: number;
  horas_trabajo_persona: number;
  duracion_total_h: number;
  dias: number;
  operarios: number;
  vehiculo: string;
};

export type PresupuestoPayload = {
  version: number;
  objetos: ObjetoLinea[];
  productos: ProductoLinea[];
  accesos: AccesosInput;
  // Presente desde v3 (snapshots antiguos no lo traen).
  resumen?: ResumenPresupuesto | null;
};

export type AccesosDefault = {
  origen_planta: number;
  origen_ascensor: boolean;
  destino_planta: number;
  destino_ascensor: boolean;
};

// Valores crudos del lead para "Usar datos del cliente" (null = vacío).
export type DatosCliente = {
  origen_planta: string | null;
  origen_ascensor: boolean | null;
  destino_planta: string | null;
  destino_ascensor: boolean | null;
};

const SWITCHES: { key: keyof Interruptores; label: string }[] = [
  { key: "desmontaje", label: "Desmontaje" },
  { key: "montaje", label: "Montaje" },
  { key: "film", label: "Film" },
  { key: "burbujas", label: "Burbujas" },
  { key: "punto_limpio", label: "Punto limpio" },
];

function n(value: string): number {
  const x = Number(value.replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export default function PresupuestoForm({
  leadId,
  accesosDefault,
  datosCliente,
  initial,
  initialFechaMudanza,
  presupuestoId,
  onSaved,
}: {
  leadId: string;
  accesosDefault: AccesosDefault;
  datosCliente: DatosCliente;
  initial: PresupuestoPayload | null;
  initialFechaMudanza: string | null;
  presupuestoId: string | null;
  onSaved: (id: string) => void;
}) {
  // --- Estado sembrado desde `initial` (o vacío). El remount por key lo resetea. ---
  const [lineas, setLineas] = useState<ObjLineaUI[]>(() =>
    initial
      ? initial.objetos.map((o) => ({
          id: o.id,
          objeto: o.objeto,
          sala: o.sala,
          volumen_m3: o.volumen_m3,
          cantidad: o.cantidad,
          sw: o.interruptores,
        }))
      : []
  );
  const [productos, setProductos] = useState<ProdLineaUI[]>(() =>
    initial
      ? initial.productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          volumen_m3: p.volumen_m3,
          coste_unitario: p.coste_unitario,
          cantidad: p.cantidad,
        }))
      : []
  );

  const a = initial?.accesos;
  const [kmBaseOrigen, setKmBaseOrigen] = useState(a ? String(a.km_base_origen) : "");
  const [kmOrigenDestino, setKmOrigenDestino] = useState(
    a ? String(a.km_origen_destino) : ""
  );
  const [kmDestinoBase, setKmDestinoBase] = useState(a ? String(a.km_destino_base) : "");
  const [origenPlanta, setOrigenPlanta] = useState(
    String(a ? a.origen_planta : accesosDefault.origen_planta)
  );
  const [origenAscensor, setOrigenAscensor] = useState(
    a ? a.origen_ascensor : accesosDefault.origen_ascensor
  );
  const [destinoPlanta, setDestinoPlanta] = useState(
    String(a ? a.destino_planta : accesosDefault.destino_planta)
  );
  const [destinoAscensor, setDestinoAscensor] = useState(
    a ? a.destino_ascensor : accesosDefault.destino_ascensor
  );
  const [accesoDificil, setAccesoDificil] = useState(a ? a.acceso_dificil : false);
  const [urgencia, setUrgencia] = useState(a ? a.urgencia : false);
  const [permisos, setPermisos] = useState(String(a ? a.permisos : 0));

  // Fecha acordada de la mudanza (opcional). No interviene en el cálculo del
  // precio, así que cambiarla no invalida el resultado ya calculado.
  const [fechaMudanza, setFechaMudanza] = useState(initialFechaMudanza ?? "");

  // Buscadores
  const [qObj, setQObj] = useState("");
  const [resObj, setResObj] = useState<ObjetoBusqueda[]>([]);
  const [qProd, setQProd] = useState("");
  const [resProd, setResProd] = useState<ProductoBusqueda[]>([]);

  // Resultado
  const [resultado, setResultado] = useState<PresupuestoResultado | null>(null);
  // Al cambiar datos, el resultado NO se borra: se marca obsoleto (atenuado +
  // aviso) para que el operario entienda que debe recalcular, en vez de verlo
  // desaparecer sin explicación.
  const [obsoleto, setObsoleto] = useState(false);
  const [precioAjustado, setPrecioAjustado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [calculando, startCalculo] = useTransition();
  const [guardando, startGuardado] = useTransition();

  // --- Buscadores con debounce ---
  const tObj = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tObj.current) clearTimeout(tObj.current);
    if (qObj.trim().length < 2) {
      // Limpia resultados obsoletos al quedar la consulta demasiado corta; es un
      // reset puntual, no un ciclo de renders. Falso positivo de la regla.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResObj([]);
      return;
    }
    tObj.current = setTimeout(async () => setResObj(await buscarObjetos(qObj)), 250);
    return () => {
      if (tObj.current) clearTimeout(tObj.current);
    };
  }, [qObj]);

  const tProd = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tProd.current) clearTimeout(tProd.current);
    if (qProd.trim().length < 1) {
      // Limpia resultados obsoletos al quedar la consulta demasiado corta; es un
      // reset puntual, no un ciclo de renders. Falso positivo de la regla.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResProd([]);
      return;
    }
    tProd.current = setTimeout(async () => setResProd(await buscarProductos(qProd)), 250);
    return () => {
      if (tProd.current) clearTimeout(tProd.current);
    };
  }, [qProd]);

  function invalidar() {
    // Solo marca obsoleto si ya hay un resultado que mostrar atenuado.
    if (resultado) setObsoleto(true);
    setGuardado(false);
  }

  // --- Objetos ---
  function anadirObjeto(o: ObjetoBusqueda) {
    setLineas((prev) => {
      const i = prev.findIndex((l) => String(l.id) === String(o.id));
      if (i >= 0) {
        const c = [...prev];
        c[i] = { ...c[i], cantidad: c[i].cantidad + 1 };
        return c;
      }
      return [
        ...prev,
        {
          id: o.id,
          objeto: o.objeto,
          sala: o.sala,
          volumen_m3: o.volumen_m3,
          cantidad: 1,
          sw: interruptoresPorDefecto(o),
        },
      ];
    });
    invalidar();
  }
  function setCantidadObj(id: string | number, cantidad: number) {
    setLineas((prev) =>
      prev.map((l) =>
        String(l.id) === String(id) ? { ...l, cantidad: Math.max(1, cantidad) } : l
      )
    );
    invalidar();
  }
  function toggleSw(id: string | number, key: keyof Interruptores) {
    setLineas((prev) =>
      prev.map((l) =>
        String(l.id) === String(id) ? { ...l, sw: { ...l.sw, [key]: !l.sw[key] } } : l
      )
    );
    invalidar();
  }
  function quitarObj(id: string | number) {
    setLineas((prev) => prev.filter((l) => String(l.id) !== String(id)));
    invalidar();
  }

  // --- Productos ---
  function anadirProducto(p: ProductoBusqueda) {
    setProductos((prev) => {
      const i = prev.findIndex((l) => String(l.id) === String(p.id));
      if (i >= 0) {
        const c = [...prev];
        c[i] = { ...c[i], cantidad: c[i].cantidad + 1 };
        return c;
      }
      return [
        ...prev,
        {
          id: p.id,
          nombre: p.nombre,
          volumen_m3: p.volumen_m3,
          coste_unitario: p.coste_unitario,
          cantidad: 1,
        },
      ];
    });
    invalidar();
  }
  function setCantidadProd(id: string | number, cantidad: number) {
    setProductos((prev) =>
      prev.map((l) =>
        String(l.id) === String(id) ? { ...l, cantidad: Math.max(1, cantidad) } : l
      )
    );
    invalidar();
  }
  function quitarProd(id: string | number) {
    setProductos((prev) => prev.filter((l) => String(l.id) !== String(id)));
    invalidar();
  }

  // Copia los accesos del lead al formulario. Campo vacío en el lead → se deja.
  function usarDatosCliente() {
    const d = datosCliente;
    if (d.origen_planta != null && d.origen_planta.trim() !== "")
      setOrigenPlanta(String(parsePlantaNum(d.origen_planta)));
    if (d.origen_ascensor != null) setOrigenAscensor(d.origen_ascensor);
    if (d.destino_planta != null && d.destino_planta.trim() !== "")
      setDestinoPlanta(String(parsePlantaNum(d.destino_planta)));
    if (d.destino_ascensor != null) setDestinoAscensor(d.destino_ascensor);
    invalidar();
  }

  const accesosPayload = (): AccesosInput => ({
    km_base_origen: n(kmBaseOrigen),
    km_origen_destino: n(kmOrigenDestino),
    km_destino_base: n(kmDestinoBase),
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
    if (lineas.length === 0 && productos.length === 0) {
      setError("Añade al menos un objeto o producto.");
      return;
    }
    startCalculo(async () => {
      const res = await calcularPresupuestoAction({
        objetos: lineas.map((l) => ({ id: l.id, cantidad: l.cantidad, interruptores: l.sw })),
        productos: productos.map((l) => ({ id: l.id, cantidad: l.cantidad })),
        accesos: accesosPayload(),
      });
      if (res.ok) {
        setResultado(res.resultado);
        setObsoleto(false);
        setPrecioAjustado(round2(res.resultado.precio_final).toFixed(2));
      } else {
        setError(res.error);
        setResultado(null);
        setObsoleto(false);
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
        presupuestoId,
        objetos: lineas.map((l) => ({ id: l.id, cantidad: l.cantidad, interruptores: l.sw })),
        productos: productos.map((l) => ({ id: l.id, cantidad: l.cantidad })),
        accesos: accesosPayload(),
        precioFinalAjustado: parsed > 0 ? round2(parsed) : null,
        fechaMudanza: fechaMudanza.trim() || null,
      });
      if (res.ok) {
        setGuardado(true);
        onSaved(res.id);
      } else {
        setError(res.error);
      }
    });
  }

  // Margen en vivo del precio ajustado (base = coste base, sin punto limpio).
  const ivaRate =
    resultado && resultado.subtotal_pre_iva > 0
      ? resultado.iva_eur / resultado.subtotal_pre_iva
      : 0;
  const ajuste = useMemo(() => {
    if (!resultado) return null;
    return margenAjustado(
      n(precioAjustado),
      resultado.coste_base,
      ivaRate,
      resultado.cargo_punto_limpio
    );
  }, [precioAjustado, resultado, ivaRate]);

  const porSala = useMemo(() => {
    const g = new Map<string, ObjetoBusqueda[]>();
    for (const o of resObj) {
      const k = o.sala?.trim() || "Otros";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(o);
    }
    return [...g.entries()];
  }, [resObj]);

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Inventario (el cliente ya lo tiene) ===== */}
      <div>
        <p className={labelClass}>Inventario del cliente — cosas que YA tiene</p>
        <p className="mb-2 text-[11px] text-black/40">
          Solo cuentan como volumen. No se cobran.
        </p>
        <input
          type="search"
          value={qObj}
          onChange={(e) => setQObj(e.target.value)}
          placeholder="Buscar objeto (ej. sofá, armario, caja)…"
          className={fieldClass}
        />
        {qObj.trim().length >= 2 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-card border border-hairline">
            {resObj.length === 0 && (
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
                    onClick={() => anadirObjeto(o)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gris"
                  >
                    <span>{o.objeto}</span>
                    <span className="text-xs text-black/50">{o.volumen_m3} m³ · Añadir +</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {lineas.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {lineas.map((l) => (
              <div key={String(l.id)} className="rounded-card border border-hairline p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {l.objeto}
                    <span className="ml-2 text-xs font-normal text-black/40">
                      {l.volumen_m3} m³
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Stepper
                      value={l.cantidad}
                      onChange={(v) => setCantidadObj(l.id, v)}
                    />
                    <button
                      type="button"
                      onClick={() => quitarObj(l.id)}
                      className="ml-1 rounded-field px-2 py-1 text-xs text-black/50 hover:bg-gris hover:text-black"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {SWITCHES.map((s) => (
                    <label
                      key={s.key}
                      className="flex items-center gap-1.5 text-xs text-black/70"
                    >
                      <input
                        type="checkbox"
                        checked={l.sw[s.key]}
                        onChange={() => toggleSw(l.id, s.key)}
                        className="h-3.5 w-3.5 accent-black"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Productos (los vendemos) ===== */}
      <div className="rounded-card border border-hairline bg-gris/30 p-3">
        <p className={labelClass}>Productos — los vendemos nosotros</p>
        <p className="mb-2 text-[11px] text-black/40">
          Suman volumen y se cobran (coste × cantidad, con margen e IVA).
        </p>
        <input
          type="search"
          value={qProd}
          onChange={(e) => setQProd(e.target.value)}
          placeholder="Buscar producto (ej. caja, bolsa)…"
          className={`${fieldClass} bg-white`}
        />
        {qProd.trim().length >= 1 && (
          <div className="mt-2 max-h-44 overflow-y-auto rounded-card border border-hairline bg-white">
            {resProd.length === 0 && (
              <p className="px-3 py-2 text-sm text-black/50">Sin resultados.</p>
            )}
            {resProd.map((p) => (
              <button
                key={String(p.id)}
                type="button"
                onClick={() => anadirProducto(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gris"
              >
                <span>{p.nombre}</span>
                <span className="text-xs text-black/50">
                  {formatPrecio(p.coste_unitario)} · {p.volumen_m3} m³ · Añadir +
                </span>
              </button>
            ))}
          </div>
        )}

        {productos.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {productos.map((l) => (
              <div
                key={String(l.id)}
                className="flex items-center justify-between gap-3 rounded-card border border-hairline bg-white px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {l.nombre}
                  <span className="ml-2 text-xs text-black/40">
                    {formatPrecio(l.coste_unitario)} · {l.volumen_m3} m³
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <Stepper value={l.cantidad} onChange={(v) => setCantidadProd(l.id, v)} />
                  <button
                    type="button"
                    onClick={() => quitarProd(l.id)}
                    className="ml-1 rounded-field px-2 py-1 text-xs text-black/50 hover:bg-gris hover:text-black"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Distancia (tres tramos) ===== */}
      <div>
        <p className={labelClass}>Distancia (base en Canovelles, Barcelona)</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <KmField label="Base → Origen" value={kmBaseOrigen} onChange={(v) => { setKmBaseOrigen(v); invalidar(); }} />
          <KmField label="Origen → Destino" value={kmOrigenDestino} onChange={(v) => { setKmOrigenDestino(v); invalidar(); }} />
          <KmField label="Destino → Base" value={kmDestinoBase} onChange={(v) => { setKmDestinoBase(v); invalidar(); }} />
        </div>
      </div>

      {/* ===== Accesos ===== */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={labelClass}>Accesos</p>
          <button
            type="button"
            onClick={usarDatosCliente}
            className={btn({ variant: "secondary", size: "sm" })}
          >
            Usar datos del cliente
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Planta origen</label>
          <input type="number" value={origenPlanta} onChange={(e) => { setOrigenPlanta(e.target.value); invalidar(); }} className={`mt-2 ${fieldClass}`} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={origenAscensor} onChange={(e) => { setOrigenAscensor(e.target.checked); invalidar(); }} className="h-4 w-4 accent-black" />
          Ascensor en origen
        </label>
        <div>
          <label className={labelClass}>Planta destino</label>
          <input type="number" value={destinoPlanta} onChange={(e) => { setDestinoPlanta(e.target.value); invalidar(); }} className={`mt-2 ${fieldClass}`} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={destinoAscensor} onChange={(e) => { setDestinoAscensor(e.target.checked); invalidar(); }} className="h-4 w-4 accent-black" />
          Ascensor en destino
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={accesoDificil} onChange={(e) => { setAccesoDificil(e.target.checked); invalidar(); }} className="h-4 w-4 accent-black" />
          Acceso difícil
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={urgencia} onChange={(e) => { setUrgencia(e.target.checked); invalidar(); }} className="h-4 w-4 accent-black" />
          Urgencia
        </label>
        <div className="col-span-2">
          <label className={labelClass}>Permisos de estacionamiento necesarios</label>
          <input type="number" min={0} value={permisos} onChange={(e) => { setPermisos(e.target.value); invalidar(); }} className={`mt-2 ${fieldClass}`} />
        </div>
        </div>
      </div>

      {/* ===== Fecha de la mudanza (opcional) ===== */}
      <div>
        <label htmlFor="fecha_mudanza" className={labelClass}>
          Fecha de la mudanza
        </label>
        <p className="mb-2 text-[11px] text-black/40">
          Fecha acordada con el cliente. Opcional: se guarda con el presupuesto y,
          al pagar, fija el día de la operación en el calendario.
        </p>
        <input
          id="fecha_mudanza"
          type="date"
          value={fechaMudanza}
          onChange={(e) => setFechaMudanza(e.target.value)}
          className={`${fieldClass} w-auto`}
        />
      </div>

      <button
        type="button"
        onClick={calcular}
        disabled={calculando}
        className={btn({ variant: "primary", size: "md" })}
      >
        {calculando ? "Calculando…" : "Calcular"}
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {resultado && (
        <Resultado
          r={resultado}
          obsoleto={obsoleto}
          precioAjustado={precioAjustado}
          setPrecioAjustado={(v) => {
            setPrecioAjustado(v);
            setGuardado(false);
          }}
          ajuste={ajuste}
          onGuardar={guardar}
          guardando={guardando}
          guardado={guardado}
          editando={Boolean(presupuestoId)}
        />
      )}
    </div>
  );
}

function KmField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] text-black/50">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="mt-1 w-full rounded-field bg-gris px-2 py-2 text-sm outline-none border border-transparent focus:border-black"
      />
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-field border border-hairline">
      <button type="button" onClick={() => onChange(value - 1)} className="px-2 py-1 text-sm hover:bg-gris" aria-label="Menos">
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className="w-12 border-x border-hairline bg-white px-1 py-1 text-center text-sm outline-none"
      />
      <button type="button" onClick={() => onChange(value + 1)} className="px-2 py-1 text-sm hover:bg-gris" aria-label="Más">
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

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function Resultado({
  r,
  obsoleto,
  precioAjustado,
  setPrecioAjustado,
  ajuste,
  onGuardar,
  guardando,
  guardado,
  editando,
}: {
  r: PresupuestoResultado;
  obsoleto: boolean;
  precioAjustado: string;
  setPrecioAjustado: (v: string) => void;
  ajuste: ReturnType<typeof margenAjustado> | null;
  onGuardar: () => void;
  guardando: boolean;
  guardado: boolean;
  editando: boolean;
}) {
  const num = (x: number, d = 2) =>
    x.toLocaleString("es-ES", { maximumFractionDigits: d });

  return (
    <div className="rounded-card border border-hairline bg-gris/40 p-4">
      {obsoleto && (
        <p className="mb-3 rounded-field bg-white px-3 py-2 text-sm font-medium text-black">
          Los datos han cambiado. Pulsa «Calcular» para actualizar el precio.
        </p>
      )}
      <div className={obsoleto ? "pointer-events-none opacity-50" : ""}>
      <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
        <Dato label="Volumen" value={`${num(r.volumen_total_m3, 2)} m³`} />
        <Dato label="Vehículo" value={r.viajes > 1 ? `${r.vehiculo} ×${r.viajes}` : r.vehiculo} />
        <Dato label="Operarios" value={String(r.operarios)} />
        <Dato label="Días" value={String(r.dias)} />
      </div>
      <p className="mt-2 text-xs text-black/50">
        Volumen neto: objetos {num(r.volumen_objetos_m3, 2)} m³ + productos{" "}
        {num(r.volumen_productos_m3, 2)} m³ · Espacio en vehículo{" "}
        {num(r.volumen_real_ocupado_m3, 2)} m³ (aprov.{" "}
        {num(r.factor_aprovechamiento_vehiculo * 100, 0)}%) · Trabajo{" "}
        {num(r.horas_trabajo_persona, 1)} h-persona (manejo {num(r.horas_manejo, 1)}{" "}
        · desmontaje {num(r.horas_desmontaje, 1)} · montaje {num(r.horas_montaje, 1)})
        · Duración ~{num(r.duracion_total_h, 1)} h ({r.operarios} operarios en
        paralelo al {num(r.factor_paralelo * 100, 0)}% + trayecto{" "}
        {num(r.horas_trayecto, 1)} h) · {num(r.km_totales, 0)} km
      </p>

      {/* Cada línea se redondea por separado para mostrarla; el total es el
          precio_final real (lo que se cobra), por lo que la suma visual de las
          líneas puede diferir ±0,01. Es cosmético: el importe cobrado manda. */}
      <div className="mt-4 border-t border-hairline pt-3">
        <Linea label="Vehículo" value={formatPrecio(round2(r.coste_vehiculo))} />
        <Linea label="Distancia" value={formatPrecio(round2(r.coste_distancia))} />
        <Linea label="Personal" value={formatPrecio(round2(r.coste_personal))} />
        <Linea label="Embalaje" value={formatPrecio(round2(r.coste_embalaje))} />
        <Linea label="Productos" value={formatPrecio(round2(r.coste_productos))} />
        <Linea label="Extras (accesos)" value={formatPrecio(round2(r.coste_extras))} />
        {r.recargo_urgencia_eur > 0 && (
          <Linea label="Recargo urgencia" value={formatPrecio(round2(r.recargo_urgencia_eur))} />
        )}
        <div className="mt-1 border-t border-hairline pt-1">
          <Linea label="Coste base" value={formatPrecio(round2(r.coste_base))} />
        </div>
        <Linea label="Margen" value={formatPrecio(round2(r.margen_eur))} />
        {r.cargo_punto_limpio > 0 && (
          <Linea label="Punto limpio (sin margen)" value={formatPrecio(round2(r.cargo_punto_limpio))} />
        )}
        <Linea label="IVA" value={formatPrecio(round2(r.iva_eur))} />
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
        <span className="text-sm font-medium">Precio final</span>
        <span className="text-2xl font-semibold tabular-nums">
          {formatPrecio(round2(r.precio_final))}
        </span>
      </div>

      <div className="mt-4 rounded-card border border-hairline bg-white p-3">
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
            className="w-40 rounded-field bg-gris px-3 py-2 text-sm tabular-nums outline-none border border-transparent focus:border-black"
          />
          <span className="text-sm text-black/50">€ (IVA incluido)</span>
        </div>

        {ajuste && (
          <div className="mt-3 text-sm">
            <p>
              Margen real:{" "}
              <span className="font-medium tabular-nums">
                {formatPrecio(round2(ajuste.margen_eur))} ({num(ajuste.margen_pct, 1)}%)
              </span>
            </p>
            {ajuste.bajo_coste ? (
              <p className="mt-1 rounded-field bg-red-600 px-3 py-2 font-semibold text-white">
                ⚠ Por debajo del coste base: vender a este precio da PÉRDIDAS.
              </p>
            ) : ajuste.bajo_minimo ? (
              <p className="mt-1 rounded-field border border-red-600 px-3 py-2 font-medium text-red-600">
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
          disabled={guardando || obsoleto}
          className={btn({ variant: "primary", size: "md" })}
        >
          {guardando
            ? "Guardando…"
            : editando
            ? "Actualizar presupuesto"
            : "Guardar presupuesto"}
        </button>
        {guardado && (
          <span className="text-sm text-black/60" role="status">
            Presupuesto guardado (borrador).
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
