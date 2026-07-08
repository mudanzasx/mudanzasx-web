"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { btn } from "@/components/ui/button";

const labelClass = "block text-sm font-medium text-black";
const fieldClass =
  "mt-2 w-full rounded-field bg-gris px-4 py-3 text-base text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // Mensaje genérico: no revelamos si el email existe.
      setError("Credenciales incorrectas. Revisa el email y la contraseña.");
      setEnviando(false);
      return;
    }

    // La sesión ya está en las cookies; refrescamos para que el servidor la lea.
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      {error && (
        <p className="text-[15px] text-black" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className={btn({ variant: "primary", size: "lg", className: "mt-2 w-full" })}
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
