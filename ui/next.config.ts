import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Webpack 5 doesn't polyfill WebAssembly.instantiateStreaming by default
    config.output = {
      ...config.output,
      webassemblyModuleFilename: "static/wasm/[modulehash].wasm",
    };

    return config;
  },

  // Configure allowed image domains for next/image
  images: {
    domains: ["gateway.pinata.cloud"],
  },
};

export default nextConfig;
