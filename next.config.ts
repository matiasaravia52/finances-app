import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    // Ignorar los errores de ESLint durante la compilación
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
