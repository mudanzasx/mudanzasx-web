"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellOff, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Aviso en tiempo real de leads nuevos dentro del panel. Complementa la
// notificación por email al negocio: el email avisa estés donde estés; esto
// avisa mientras el panel está abierto. Se monta en el layout del panel, así
// que está activo en TODAS las vistas (lista, ficha, calendario, operación).
//
// - Suscripción a los INSERT de `leads` vía Supabase Realtime (cliente de
//   navegador, con la sesión admin ya presente en cookies).
// - Solo avisa de los leads de la web (via_entrada = "web"); el alta manual del
//   panel la hace el propio operario, así que no se notifica.
// - Aviso doble: sonido corto (si está activado) + toast sobrio (imprescindible,
//   por si el sonido está bloqueado/silenciado).
// - Robusto: si Realtime falla o se cae, el panel sigue igual (la lista se ve al
//   recargar); nada de errores visibles. Se limpia la suscripción al desmontar y
//   se ignoran eventos duplicados del mismo lead.

type Toast = { id: string; nombre: string };

// Preferencia de sonido persistida entre recargas (por sesión del navegador es
// suficiente, pero localStorage la recuerda sin coste). Por defecto DESACTIVADO:
// el navegador bloquea el autoplay hasta que el usuario interactúa, así que
// activarlo con el botón (un gesto) es justo lo que desbloquea el audio.
const PREF_KEY = "mx-admin-sonido-leads";
const TOAST_MS = 8000;

export default function AvisosLead() {
  const router = useRouter();
  const [sonido, setSonido] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vistos = useRef<Set<string>>(new Set());
  // Espejo de `sonido` para leerlo dentro del handler de Realtime, que se
  // registra una sola vez y no vería el estado actualizado por closure.
  const sonidoRef = useRef(false);
  useEffect(() => {
    sonidoRef.current = sonido;
  }, [sonido]);

  // Carga inicial: preferencia guardada + preparación del audio.
  useEffect(() => {
    try {
      // Se lee tras el montaje (no en el render) a propósito: leer localStorage
      // durante el render rompería la hidratación (el servidor no lo tiene) y
      // haría parpadear el icono de la campana.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(PREF_KEY) === "1") setSonido(true);
    } catch {
      /* localStorage no disponible: se queda por defecto (off) */
    }
    audioRef.current = new Audio("/nuevo-lead.wav");
    audioRef.current.preload = "auto";
  }, []);

  const quitarToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const reproducir = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      // play() devuelve una promesa que puede rechazar por la política de
      // autoplay; se ignora sin romper nada (el toast sigue funcionando).
      void a.play().catch(() => {});
    } catch {
      /* algún navegador antiguo puede lanzar de forma síncrona */
    }
  }, []);

  const toggleSonido = useCallback(() => {
    setSonido((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PREF_KEY, next ? "1" : "0");
      } catch {
        /* sin persistencia: vale igual por sesión */
      }
      // Activar es un gesto del usuario → desbloquea el audio en la sesión; un
      // "ding" corto confirma que el sonido funciona.
      if (next) reproducir();
      return next;
    });
  }, [reproducir]);

  // Suscripción a Realtime (una sola vez).
  useEffect(() => {
    let cancelado = false;
    let limpiar = () => {};
    try {
      const supabase = createSupabaseBrowserClient();
      let channel: ReturnType<typeof supabase.channel> | null = null;

      (async () => {
        // Realtime respeta la RLS: la conexión debe llevar el token de la sesión
        // admin para recibir las filas que el usuario puede ver.
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) supabase.realtime.setAuth(data.session.access_token);
        } catch {
          /* seguimos: si no hay token, RLS filtrará sin romper nada */
        }
        if (cancelado) return;

        channel = supabase
          .channel("panel-leads-nuevos")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "leads" },
            (payload) => {
              const row = payload.new as {
                id?: string;
                nombre?: string | null;
                via_entrada?: string | null;
              };
              const id = row?.id;
              if (!id) return;
              // Solo leads de la web; el alta manual no avisa.
              if (row.via_entrada !== "web") return;
              // Anti-duplicados (por si llega el evento más de una vez).
              if (vistos.current.has(id)) return;
              vistos.current.add(id);

              const nombre = (row.nombre ?? "").trim() || "Sin nombre";
              if (sonidoRef.current) reproducir();
              setToasts((t) => [...t, { id, nombre }]);
              setTimeout(() => quitarToast(id), TOAST_MS);
              // Refresca la vista actual: si es la lista de leads, aparece sin
              // recargar; en otras vistas es inocuo.
              router.refresh();
            }
          )
          .subscribe();
      })();

      limpiar = () => {
        if (channel) supabase.removeChannel(channel);
      };
    } catch (e) {
      // Realtime no disponible: el panel funciona igual (la lista se ve al
      // recargar). No se muestra ningún error al usuario.
      console.error("[avisos-lead] Realtime no disponible:", e);
    }

    return () => {
      cancelado = true;
      limpiar();
    };
  }, [router, reproducir, quitarToast]);

  return (
    <>
      <button
        type="button"
        onClick={toggleSonido}
        aria-pressed={sonido}
        aria-label={
          sonido
            ? "Silenciar el sonido de avisos de nuevos leads"
            : "Activar el sonido de avisos de nuevos leads"
        }
        title={
          sonido ? "Sonido de avisos activado" : "Sonido de avisos desactivado"
        }
        className="rounded-pill p-2 text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {sonido ? (
          <Bell size={18} strokeWidth={1.5} />
        ) : (
          <BellOff size={18} strokeWidth={1.5} />
        )}
      </button>

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-xs flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-card border border-hairline bg-white px-4 py-3 text-black shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-black/50">
                  Nuevo lead
                </p>
                <p className="truncate text-sm font-medium">{t.nombre}</p>
                <Link
                  href={`/admin/leads/${t.id}`}
                  onClick={() => quitarToast(t.id)}
                  className="mt-1 inline-block text-sm font-medium underline underline-offset-2 hover:text-black/70"
                >
                  Ver ficha →
                </Link>
              </div>
              <button
                type="button"
                onClick={() => quitarToast(t.id)}
                aria-label="Cerrar aviso"
                className="shrink-0 rounded-field p-1 text-black/40 outline-none transition-colors hover:bg-gris hover:text-black focus-visible:ring-2 focus-visible:ring-black/40"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
