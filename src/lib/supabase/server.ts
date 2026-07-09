import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Cliente para server components, route handlers y server actions.
// Lee y refresca la sesión a través de las cookies de la petición.
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` puede fallar cuando se llama desde un Server Component
          // (no puede escribir cookies). El proxy se encarga de refrescar la
          // sesión, así que aquí es seguro ignorarlo.
        }
      },
    },
  });
}
