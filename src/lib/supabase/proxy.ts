import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Refresca la sesión y devuelve el usuario junto con la respuesta que lleva
// las cookies actualizadas. La barrera de redirección vive en `src/proxy.ts`.
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANTE: getUser() revalida el token contra Supabase, no confía en la cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Autorización: además de sesión válida, el usuario debe estar en `admins`.
  // Fail-closed: cualquier error de lectura o fila ausente => no admin.
  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(data);
  }

  return { response, user, isAdmin };
}
