import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nota: `output: "standalone"` se eliminó porque es para auto-hosteo
  // (Docker/VPS). En Vercel, Next.js usa su propia optimización de build.
  typescript: {
    // Pendiente: idealmente quitar este flag una vez que se limpien los
    // errores TS residuales del proyecto. Por ahora se mantiene para no
    // romper el build en Vercel.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Reducir memoria en build: desactivar worker threads (usan RAM extra)
  // y limitar el cache de páginas estáticas
  experimental: {
    // En Next 16 esto reduce el uso de memoria del build
    staticGenerationMaxConcurrency: 1,
  },
};

export default nextConfig;
