import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center" aria-label="Mudanzas X · Panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.svg" alt="Mudanzas X" className="h-5 w-auto" />
          </Link>

          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
