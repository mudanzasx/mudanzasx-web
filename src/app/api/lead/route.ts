import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/anon";
import { esTelefonoEsValido, esEmailValido } from "@/lib/validaciones";

type LeadPayload = {
  nombre?: unknown;
  telefono?: unknown;
  email?: unknown;
  origen?: unknown;
  destino?: unknown;
  acepta?: unknown;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// --- Rate limiting por IP (mitigación básica anti-spam) ---
// Ventana deslizante en memoria: máx. MAX_POR_VENTANA envíos por IP cada
// VENTANA_MS. AVISO: la memoria NO se comparte entre instancias serverless (cada
// lambda tiene la suya) ni sobrevive a un cold start, así que esto es solo una
// primera barrera. La protección real será Cloudflare Turnstile (ver TODO abajo)
// + rate-limit en el edge de Cloudflare.
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos
const MAX_POR_VENTANA = 5;
const accesosPorIp = new Map<string, number[]>();

function ipDe(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "desconocida";
}

// Registra el intento y devuelve true si la IP ha superado el límite. De paso
// purga entradas caducadas para que el Map no crezca sin control.
function superaLimite(ip: string): boolean {
  const ahora = Date.now();
  if (accesosPorIp.size > 5000) {
    for (const [k, ts] of accesosPorIp) {
      const vivos = ts.filter((t) => ahora - t < VENTANA_MS);
      if (vivos.length === 0) accesosPorIp.delete(k);
      else accesosPorIp.set(k, vivos);
    }
  }
  const recientes = (accesosPorIp.get(ip) ?? []).filter(
    (t) => ahora - t < VENTANA_MS
  );
  if (recientes.length >= MAX_POR_VENTANA) {
    accesosPorIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  accesosPorIp.set(ip, recientes);
  return false;
}

export async function POST(request: Request) {
  // Rate limit: antes de leer el cuerpo, para cortar floods barato.
  if (superaLimite(ipDe(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  // TODO(Cloudflare Turnstile): cuando se despliegue Cloudflare, verificar aquí
  // el token del captcha ANTES de continuar. El cliente enviará `body.turnstileToken`
  // y se validará contra https://challenges.cloudflare.com/turnstile/v0/siteverify
  // con TURNSTILE_SECRET_KEY (variable de entorno server-only). Si el token falta
  // o no es válido -> responder 400 sin crear el lead. De momento la protección
  // es el rate-limit por IP de arriba.

  let body: LeadPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  const nombre = asString(body.nombre);
  const telefono = asString(body.telefono);
  const email = asString(body.email);
  const origen = asString(body.origen);
  const destino = asString(body.destino);
  const acepta = body.acepta === true;

  // Validación en el servidor. Fecha y tamaño ya no se piden en la web (se
  // recogen después por teléfono), así que no se validan aquí.
  const errores: string[] = [];
  if (!nombre) errores.push("nombre");
  if (!esTelefonoEsValido(telefono)) errores.push("telefono");
  if (!esEmailValido(email)) errores.push("email");
  if (!origen) errores.push("origen");
  if (!destino) errores.push("destino");
  if (!acepta) errores.push("acepta");

  if (errores.length > 0) {
    return NextResponse.json(
      { error: "Datos incompletos o no válidos.", campos: errores },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("leads").insert({
    nombre,
    telefono,
    email,
    origen_direccion: origen,
    destino_direccion: destino,
    via_entrada: "web",
  });

  if (error) {
    // Si falla por RLS/permisos, se ajusta aparte en Supabase.
    console.error("Error insertando lead:", error.message);
    return NextResponse.json(
      { error: "No se pudo guardar la solicitud." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
