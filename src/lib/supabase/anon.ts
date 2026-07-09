import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Cliente anónimo sin sesión (stateless), con @supabase/supabase-js. Solo se usa
// para la inserción pública de leads desde /api/lead; la política de RLS de anon
// se gestiona aparte en Supabase. El resto del proyecto usa los clientes SSR de
// ./client (navegador), ./server y ./proxy.
const { url, anonKey } = getSupabaseEnv();
export const supabase = createClient(url, anonKey);
