"use client";

import { useState, useTransition } from "react";
import { formatPrecio } from "@/lib/leads";
import { round2 } from "@/lib/presupuesto";
import EstadoPill from "@/components/admin/EstadoPill";
import {
  crearEnlacePago,
  crearEnlaceResto,
  enviarEnlacePago,
  type Pago,
  type TipoCobro,
} from "./pagoActions";

// Tipo del enlace actualmente generado (para adaptar el email).
type TipoEnlace = "reserva50" | "total" | "resto";

function tipoLabel(tipo: string | null): string {
  if (tipo === "total") return "Total (100% con 5% dto)";
  if (tipo === "reserva50") return "Reserva 50%";
  if (tipo === "resto") return "Pago completo";
  return "—";
}

export default function PagoPresupuesto({
  presupuestoId,
  precioFinal,
  pagoInicial,
}: {
  presupuestoId: string;
  precioFinal: number | null;
  pagoInicial: Pago | null;
}) {
  const [pago, setPago] = useState<Pago | null>(pagoInicial);
  const [url, setUrl] = useState<string | null>(null);
  const [urlTipo, setUrlTipo] = useState<TipoEnlace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [creando, startCrear] = useTransition();
  const [enviando, startEnviar] = useTransition();
  const [emailMsg, setEmailMsg] = useState<
    { ok: boolean; texto: string } | null
  >(null);

  const precio = precioFinal ?? 0;
  const importeReserva = round2(precio * 0.5);
  const importeTotal = round2(precio * 0.95);

  function reset() {
    setError(null);
    setUrl(null);
    setUrlTipo(null);
    setCopiado(false);
    setEmailMsg(null);
  }

  function cobrar(tipo: TipoCobro) {
    reset();
    startCrear(async () => {
      const res = await crearEnlacePago(presupuestoId, tipo);
      if (res.ok) {
        setPago(res.pago);
        setUrl(res.url);
        setUrlTipo(tipo);
      } else {
        setError(res.error);
      }
    });
  }

  function cobrarResto() {
    reset();
    startCrear(async () => {
      const res = await crearEnlaceResto(presupuestoId);
      if (res.ok) {
        setPago(res.pago);
        setUrl(res.url);
        setUrlTipo("resto");
      } else {
        setError(res.error);
      }
    });
  }

  function enviarEmail() {
    if (!urlTipo) return;
    setEmailMsg(null);
    startEnviar(async () => {
      const res = await enviarEnlacePago(presupuestoId, urlTipo);
      if (res.ok) {
        setEmailMsg({ ok: true, texto: `Email enviado a ${res.email}` });
      } else {
        setEmailMsg({ ok: false, texto: res.error });
      }
    });
  }

  // Estado del cobro para decidir qué acciones ofrecer.
  const pendiente = round2(pago?.importe_pendiente ?? 0);
  const reservaPagada = pago?.estado === "Reserva 50%" && pendiente > 0;
  const pagadoCompleto = pago?.estado === "Pagado 100%";

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="mt-2 rounded-lg bg-gris/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-black/50">
          Cobro
        </p>
        {pago && <EstadoPill estado={pago.estado} />}
      </div>

      {/* Estado del pago si ya se inició */}
      {pago && (
        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <Dato label="Total" value={formatPrecio(pago.importe_total)} />
          <Dato label="Pagado" value={formatPrecio(pago.importe_pagado)} />
          <Dato label="Pendiente" value={formatPrecio(pago.importe_pendiente)} />
          <Dato label="Tipo" value={tipoLabel(pago.tipo)} />
        </div>
      )}

      {/* Botones de cobro, según el estado del pago */}
      {pagadoCompleto ? (
        <p className="text-xs font-medium text-emerald-700">
          Cobro completado · pagado {formatPrecio(pago?.importe_pagado)}
        </p>
      ) : reservaPagada ? (
        // Reserva ya cobrada: solo queda cobrar el importe restante.
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cobrarResto}
            disabled={creando}
            className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-40"
          >
            Cobrar resto pendiente · {formatPrecio(pendiente)}
          </button>
        </div>
      ) : (
        // Cobro inicial: reserva del 50% o total con descuento.
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cobrar("reserva50")}
            disabled={creando}
            className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-40"
          >
            Cobrar reserva (50%) · {formatPrecio(importeReserva)}
          </button>
          <button
            type="button"
            onClick={() => cobrar("total")}
            disabled={creando}
            className="rounded-full border border-black/20 px-4 py-2 text-xs font-medium transition-colors hover:bg-white disabled:opacity-40"
          >
            Cobrar total (100% −5%) · {formatPrecio(importeTotal)}
          </button>
        </div>
      )}

      {creando && <p className="mt-2 text-xs text-black/50">Generando enlace…</p>}
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Enlace de pago generado */}
      {url && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-black/60">
            Enlace de pago (envíaselo al cliente)
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-xs text-black outline-none border border-black/15"
            />
            <button
              type="button"
              onClick={copiar}
              className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-medium text-white hover:bg-black/85"
            >
              {copiado ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-black/20 px-3 py-2 text-xs font-medium hover:bg-white"
            >
              Abrir enlace
            </a>
          </div>

          {/* Envío del enlace por email al cliente */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={enviarEmail}
              disabled={enviando}
              className="rounded-full border border-black/20 px-3 py-2 text-xs font-medium transition-colors hover:bg-white disabled:opacity-40"
            >
              {enviando ? "Enviando…" : "Enviar por email al cliente"}
            </button>
            {emailMsg && (
              <span
                role="status"
                className={`text-xs ${
                  emailMsg.ok ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {emailMsg.texto}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
