"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esEstadoOperativo } from "@/lib/operaciones";

export type GuardarOperacionResult =
  | { ok: true }
  | { ok: false; error: string };

export type GuardarOperacionInput = {
  fecha: string; // "" o YYYY-MM-DD
  hora: string; // "" o HH:MM
  vehiculo_id: string; // "" o uuid
  operarios_ids: string[];
  estado_operativo: string;
  notas: string; // "" o texto
};

function textoONull(v: string): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

// Guarda los campos planificables de una operación. Requiere sesión.
export async function guardarOperacion(
  id: string,
  input: GuardarOperacionInput
): Promise<GuardarOperacionResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  if (!esEstadoOperativo(input.estado_operativo)) {
    return { ok: false, error: "Estado operativo no válido." };
  }

  const operarios = Array.isArray(input.operarios_ids)
    ? input.operarios_ids.filter((x) => typeof x === "string" && x.length > 0)
    : [];

  const { error } = await supabase
    .from("operaciones")
    .update({
      fecha: textoONull(input.fecha),
      hora: textoONull(input.hora),
      vehiculo_id: textoONull(input.vehiculo_id),
      operarios_ids: operarios,
      estado_operativo: input.estado_operativo,
      notas: textoONull(input.notas),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }

  revalidatePath("/admin/calendario");
  revalidatePath(`/admin/operaciones/${id}`);
  return { ok: true };
}
