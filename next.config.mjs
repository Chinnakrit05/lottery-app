/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Electron — served via electron-serve in prod
  output: 'export',
  // Electron doesn't need Next.js Image Optimization (no server)
  images: { unoptimized: true },
  // Trailing slash so static-export paths resolve correctly
  trailingSlash: true,
  reactStrictMode: true,
  // NOTE: do NOT set assetPrefix here — it breaks nested route assets in static export.
  // electron-serve handles the custom protocol so absolute paths work.
};

export default nextConfig;
