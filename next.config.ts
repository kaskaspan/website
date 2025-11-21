import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, nextRuntime, webpack }) => {
    // Fix for Supabase client in Edge Runtime
    if (isServer && nextRuntime === "edge") {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure we don't bundle modules that use Node.js APIs not available in Edge
        ws: false,
      };
      
      // Define process.versions for Edge Runtime
      // This fixes the "process.versions is undefined" error in some Supabase dependencies
      config.plugins = [
        ...config.plugins,
        new webpack.DefinePlugin({
          "process.versions": JSON.stringify({ node: "18.0.0" }),
        }),
      ];
    }
    return config;
  },
};

export default nextConfig;
