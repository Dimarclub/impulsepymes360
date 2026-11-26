import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nota: `output: "standalone"` se eliminó porque es para auto-hosteo
  // (Docker/VPS). En Vercel, Next.js usa su propia optimización de build.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Reducir memoria en build (Vercel Free = 2GB RAM)
  experimental: {
    staticGenerationMaxConcurrency: 1,
    // Reducir el tamaño del bundle de análisis (consume RAM)
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Desactivar el cache de imágenes que consume mucha memoria en build
  images: {
    minimumCacheTTL: 0,
    // No permitir dominios externos para optimización (reduce memoria)
    remotePatterns: [],
  },
  // No prerenderar páginas con errores (reduce memoria)
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
};

export default nextConfig;
