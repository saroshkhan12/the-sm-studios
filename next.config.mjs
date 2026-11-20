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

  async redirects() {
    return [
      { source: "/account", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
