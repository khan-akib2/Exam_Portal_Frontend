/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: "50mb",
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;

