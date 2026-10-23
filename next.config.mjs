/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "@neondatabase/serverless"],
  },
};

export default nextConfig;
