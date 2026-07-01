import Stripe from "stripe";

// Cliente de Stripe solo-servidor. Inicialización perezosa para no exigir la
// clave en tiempo de build (solo se usa dentro de acciones/route handlers).
let cliente: Stripe | null = null;

export function getStripe(): Stripe {
  if (cliente) return cliente;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Falta STRIPE_SECRET_KEY en el entorno.");
  }
  cliente = new Stripe(key);
  return cliente;
}
