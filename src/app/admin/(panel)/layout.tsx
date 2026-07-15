import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AvisosLead from "@/components/admin/AvisosLead";

// Cabecera del panel + barrera de autenticación de segundo nivel (crítica):
// aunque el proxy ya redirige, revalidamos la sesión antes de renderizar
// cualquier ruta protegida. Sin usuario, no se llega a consultar ningún dato.
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gris text-black">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center" aria-label="Mudanzas X · Panel">
              {/* Móvil: solo la X (ocupa menos). Escritorio: logo completo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-white.svg" alt="Mudanzas X" className="h-6 w-auto sm:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.svg" alt="Mudanzas X" className="hidden h-5 w-auto sm:block" />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/admin"
                className="rounded-pill px-3 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Clientes
              </Link>
              <Link
                href="/admin/calendario"
                className="rounded-pill px-3 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Calendario
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Aviso en tiempo real de leads nuevos (sonido + toast) + control de
                sonido. Cliente; se monta aquí para estar activo en todo el panel. */}
            <AvisosLead />
            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="rounded-pill px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
