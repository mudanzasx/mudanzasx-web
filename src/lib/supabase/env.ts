// Lee y valida las variables de entorno públicas de Supabase. Compartido por
// todas las factorías de cliente (anon, browser, server, proxy) para no repetir
// la misma comprobación en cada una.
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno."
    );
  }
  return { url, anonKey };
}
