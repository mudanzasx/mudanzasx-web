import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
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

export async function POST(request: Request) {
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
