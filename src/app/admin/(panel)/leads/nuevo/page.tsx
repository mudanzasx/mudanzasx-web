import Link from "next/link";
import NuevoLeadForm from "./NuevoLeadForm";

export const metadata = {
  title: "Nuevo lead",
};

// Alta manual de un cliente que llama por teléfono. Reutiliza los campos y el
// estilo de la ficha de edición para mantener la coherencia del panel.
export default function NuevoLeadPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-black/60 underline-offset-2 hover:underline"
        >
          ← Volver a la lista
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-medium">Nuevo lead</h1>
        <p className="mt-1 text-sm text-black/50">
          Alta manual para clientes que contactan por teléfono.
        </p>
      </div>

      <NuevoLeadForm />
    </div>
  );
}
