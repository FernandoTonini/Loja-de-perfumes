/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.mitiendanube.com" },
      { protocol: "https", hostname: "franqueadosclubgo.com.br" },
    ],
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db", "./node_modules/.prisma/client/*"],
  },
};

export default nextConfig;
