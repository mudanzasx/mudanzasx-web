import { createSupabaseServerClient } from "@/lib/supabase/server";

// Barrera de autorización de administrador para Server Actions y route handlers.
//
// Obtiene el usuario de la sesión (getUser() revalida el token contra Supabase,
// no se fía de la cookie) y comprueba que ese usuario está en la tabla `admins`
// (allowlist por user_id). Devuelve `user: null` cuando NO hay sesión O el
// usuario NO es admin, de modo que las guardas existentes `if (!user)` de las
// acciones rechazan igual a un authenticated que no sea administrador.
//
// Defensa en profundidad: aunque el registro público de Supabase esté
// desactivado, ninguna acción del panel se ejecuta sin admin verificado.
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  // Fail-closed: ante error de lectura o fila ausente, no se concede acceso.
  if (error || !data) return { supabase, user: null };

  return { supabase, user };
}
