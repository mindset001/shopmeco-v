import type { NextConfig } from 'next'

// Note: PWA support (offline fallback, push) is implemented by hand via
// public/sw.js + components/ServiceWorkerRegister.tsx rather than a
// next-pwa/Workbox plugin — Turbopack (the default bundler since Next.js 16)
// does not support webpack plugins, so the generated-service-worker approach
// silently does nothing under this project's build.
const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
