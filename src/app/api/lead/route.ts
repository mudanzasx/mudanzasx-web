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
  turnstileToken?: unknown;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// --- Rate limiting por IP (capa adicional anti-spam) ---
// Ventana deslizante en memoria: máx. MAX_POR_VENTANA envíos por IP cada
// VENTANA_MS. AVISO: la memoria NO se comparte entre instancias serverless (cada
// lambda tiene la suya) ni sobrevive a un cold start. Es una capa complementaria
// a la verificación de Cloudflare Turnstile (abajo), no un sustituto.
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

// Verifica el token de Cloudflare Turnstile contra el endpoint de siteverify.
// Fail-closed: un fallo de red o un token inválido devuelven un motivo y el lead
// NO se crea.
async function verificarTurnstile(
  token: string,
  ip: string
): Promise<{ ok: boolean; motivo?: "network" | "invalido" }> {
  const secret = process.env.TURNSTILE_SECRET_KEY!;
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "desconocida") form.set("remoteip", ip);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, motivo: "invalido" };
  } catch (e) {
    console.error("[turnstile] Error de red verificando el token:", e);
    return { ok: false, motivo: "network" };
  }
}

export async function POST(request: Request) {
  // Rate limit: antes de leer el cuerpo, para cortar floods barato.
  if (superaLimite(ipDe(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  let body: LeadPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  // Verificación de Cloudflare Turnstile ANTES de validar o insertar. Solo se
  // aplica si el secret está configurado (en producción lo está); si falta, se
  // omite y se registra, para no dejar el formulario inutilizable en entornos
  // sin la clave.
  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileToken = asString(body.turnstileToken);
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Verificación de seguridad pendiente. Inténtalo de nuevo." },
        { status: 400 }
      );
    }
    const verif = await verificarTurnstile(turnstileToken, ipDe(request));
    if (!verif.ok) {
      // Red caída -> 503 (fail-closed); token inválido/caducado -> 403.
      const status = verif.motivo === "network" ? 503 : 403;
      return NextResponse.json(
        {
          error:
            "No se pudo verificar la seguridad. Recarga la página e inténtalo de nuevo.",
        },
        { status }
      );
    }
  } else {
    console.error(
      "[turnstile] TURNSTILE_SECRET_KEY no configurada: se omite la verificación."
    );
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
