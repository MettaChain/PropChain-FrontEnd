import type { NextConfig } from "next";

const isAnalyzeEnabled = process.env.ANALYZE === "true";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "wagmi",
      "viem",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(png|jpg|jpeg|gif|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, webpack }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@walletconnect/ethereum-provider": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@base-org/account": false,
      "@gemini-wallet/core": false,
      "@react-native-async-storage/async-storage": false,
      porto: false,
      "porto/internal": false,
    };

    if (!isServer && config.optimization?.splitChunks) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...(config.optimization.splitChunks.cacheGroups ?? {}),
          web3: {
            name: "web3-vendors",
            test: /[\\/]node_modules[\\/](wagmi|viem|ethers|@walletconnect|@metamask|@coinbase)[\\/]/,
            chunks: "all",
            priority: 35,
          },
          charts: {
            name: "chart-vendors",
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            chunks: "all",
            priority: 25,
          },
        },
      };
    }

    if (isAnalyzeEnabled && !isServer) {
      class BuildStatsPlugin {
        apply(compiler: any) {
          compiler.hooks.done.tap("BuildStatsPlugin", (stats: any) => {
            const fs = require("fs");
            const path = require("path");
            const outputPath = path.join(compiler.options.output.path ?? ".next", "build-stats.json");
            fs.writeFileSync(
              outputPath,
              JSON.stringify(
                stats.toJson({
                  all: false,
                  assets: true,
                  chunks: true,
                  chunkGroups: true,
                }),
                null,
                2
              )
            );
          });
        }
      }

      config.plugins.push(new BuildStatsPlugin());
    }

    return config;
  },
};

export default nextConfig;
