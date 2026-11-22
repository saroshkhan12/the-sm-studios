const nextConfig = {
  reactStrictMode: true,

  experimental: {
    cpus: 1,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.etsystatic.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/account", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
