import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 restringe `quality` a esta allowlist. Permitimos 82 para el LCP
    // del hero (imagen ya optimizada; no hace falta más). 75 sigue disponible
    // por defecto para el resto.
    qualities: [75, 82],
  },
};

export default nextConfig;
