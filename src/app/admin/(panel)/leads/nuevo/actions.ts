"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esEstadoComercial } from "@/lib/leads";
import {
  esTelefonoEsValido,
  esEmailValido,
  AVISO_TELEFONO,
  AVISO_EMAIL,
} from "@/lib/validaciones";

export type CrearLeadInput = {
  nombre: string;
  telefono: string;
  email: string;
  origen_direccion: string;
  origen_planta: string;
  origen_ascensor: boolean;
  destino_direccion: string;
  destino_planta: string;
  destino_ascensor: boolean;
  fecha_deseada: string;
  tamano_aprox: string;
  estado_comercial: string;
  notas: string;
};

export type CrearLeadResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Texto de un input a valor de columna: recorta y convierte vacío en null.
function texto(v: string): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

// Crea un lead manualmente desde el panel (cliente que llama por teléfono).
// Requiere sesión. Marca via_entrada = "Manual" para distinguirlo de los leads
// que llegan por el formulario web ("web"). La fecha de entrada la fija la base
// de datos por defecto (= ahora), igual que en las altas del formulario.
export async function crearLead(
  input: CrearLeadInput
): Promise<CrearLeadResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  const nombre = texto(input.nombre);
  const telefono = texto(input.telefono);
  if (!nombre || !telefono) {
    return { ok: false, error: "El nombre y el teléfono son obligatorios." };
  }
  if (!esTelefonoEsValido(telefono)) {
    return { ok: false, error: AVISO_TELEFONO };
  }
  // Email opcional: solo se valida el formato si viene relleno.
  if ((input.email ?? "").trim() !== "" && !esEmailValido(input.email)) {
    return { ok: false, error: AVISO_EMAIL };
  }

  // Estado inicial: el que elija el usuario si es válido; si no, "Nuevo".
  const estado = esEstadoComercial(input.estado_comercial)
    ? input.estado_comercial
    : "Nuevo";

  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre,
      telefono,
      email: texto(input.email),
      origen_direccion: texto(input.origen_direccion),
      origen_planta: texto(input.origen_planta),
      origen_ascensor: Boolean(input.origen_ascensor),
      destino_direccion: texto(input.destino_direccion),
      destino_planta: texto(input.destino_planta),
      destino_ascensor: Boolean(input.destino_ascensor),
      fecha_deseada: texto(input.fecha_deseada),
      tamano_aprox: texto(input.tamano_aprox),
      estado_comercial: estado,
      via_entrada: "Manual",
      notas: texto(input.notas),
    })
    .select("id")
    .single();

  if (error || !data) {
    // Suele deberse a una policy de RLS de INSERT ausente para el usuario
    // autenticado. Se registra para diagnóstico y se avisa al usuario.
    console.error("Error creando lead manual:", error?.message);
    return {
      ok: false,
      error:
        "No se pudo crear el lead. Revisa los permisos (RLS de INSERT en leads).",
    };
  }

  revalidatePath("/admin");
  return { ok: true, id: data.id as string };
}
