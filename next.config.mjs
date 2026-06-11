/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
  turbopack: {},
  async rewrites() {
    // Automatically use localhost in development, and the Render URL in production
    const isDev = process.env.NODE_ENV !== "production";
    const backendUrl = isDev 
      ? "http://localhost:5000" 
      : (process.env.NEXT_PUBLIC_API_URL || "https://exam-portal-backend-fh56.onrender.com");
      
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

