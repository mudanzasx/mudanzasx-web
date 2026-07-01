"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esEstadoComercial } from "@/lib/leads";

export type GuardarLeadResult =
  | { ok: true }
  | { ok: false; error: string };

// Actualiza estado comercial y notas de un lead. Requiere sesión (revalidada aquí).
export async function guardarLead(
  id: string,
  input: { estado_comercial: string; notas: string }
): Promise<GuardarLeadResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  if (!esEstadoComercial(input.estado_comercial)) {
    return { ok: false, error: "Estado comercial no válido." };
  }

  const { error } = await supabase
    .from("leads")
    .update({
      estado_comercial: input.estado_comercial,
      notas: input.notas,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }

  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}
