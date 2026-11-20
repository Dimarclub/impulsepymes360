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
};

export default nextConfig;
