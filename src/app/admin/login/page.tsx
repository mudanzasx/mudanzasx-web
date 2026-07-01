import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

// El login no lleva la cabecera del panel. Si ya hay sesión, al dashboard.
export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-black">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.svg" alt="Mudanzas X" className="h-6 w-auto" />
        </div>
        <h1 className="mb-1 text-center text-lg font-medium">Panel interno</h1>
        <p className="mb-8 text-center text-sm text-black/50">
          Acceso solo para el equipo.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
