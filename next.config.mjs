/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> deploy nativo su Cloudflare Pages (niente Node/Edge runtime).
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
