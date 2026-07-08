"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { esEstadoComercial } from "@/lib/leads";

export type GuardarLeadResult =
  | { ok: true }
  | { ok: false; error: string };

export type GuardarLeadInput = {
  nombre: string;
  telefono: string;
  email: string;
  origen_direccion: string;
  origen_planta: string;
  origen_ascensor: boolean;
  destino_direccion: string;
  destino_planta: string;
  destino_ascensor: boolean;
  estado_comercial: string;
  notas: string;
};

// Texto de un input a valor de columna: recorta y convierte vacío en null.
function texto(v: string): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

// Guarda toda la ficha del lead (contacto + origen + destino + estado + notas).
// Requiere sesión (revalidada aquí).
export async function guardarLead(
  id: string,
  input: GuardarLeadInput
): Promise<GuardarLeadResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return { ok: false, error: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  if (!esEstadoComercial(input.estado_comercial)) {
    return { ok: false, error: "Estado comercial no válido." };
  }

  const { error } = await supabase
    .from("leads")
    .update({
      nombre: texto(input.nombre),
      telefono: texto(input.telefono),
      email: texto(input.email),
      origen_direccion: texto(input.origen_direccion),
      origen_planta: texto(input.origen_planta),
      origen_ascensor: Boolean(input.origen_ascensor),
      destino_direccion: texto(input.destino_direccion),
      destino_planta: texto(input.destino_planta),
      destino_ascensor: Boolean(input.destino_ascensor),
      estado_comercial: input.estado_comercial,
      notas: texto(input.notas),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }

  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}
