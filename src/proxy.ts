import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Protege todas las rutas /admin/*. Solo los ADMIN (sesión válida + fila en la
// tabla `admins`) entran al panel; el resto -> /admin/login. Un admin en
// /admin/login -> /admin. El proxy es UX; cada acción revalida el admin aparte.
export async function proxy(request: NextRequest) {
  const { response, isAdmin } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/admin/login";

  // Sin admin (sin sesión o autenticado que no es admin): fuera del panel.
  if (!isAdmin && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdmin && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
