import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Vercel production ortamı için PDF optimizasyonları
  experimental: {
    serverComponentsExternalPackages: ['jspdf'],
  },
  // API routes için timeout artırma
  serverRuntimeConfig: {
    // 30 saniye timeout (PDF generation için)
    maxDuration: 30,
  },
  // PDF dosyaları için headers
  async headers() {
    return [
      {
        source: '/api/reports/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
  // Bundle analyzer için (production debugging)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side PDF handling
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // jsPDF için özel konfigürasyon
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    return config;
  },
  /* config options here */
};

export default nextConfig;
