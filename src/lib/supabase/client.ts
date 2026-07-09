import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Cliente de navegador. Solo se usa para el login (signInWithPassword);
// escribe las cookies de sesión que luego lee el servidor y el proxy.
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
