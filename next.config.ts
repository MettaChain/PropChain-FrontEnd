import type { NextConfig } from "next";

const isAnalyzeEnabled = process.env.ANALYZE === "true";
const isProd = process.env.NODE_ENV === "production";

// `BuildStatsPlugin` writes a JSON payload into `.next/` for on-demand
// inspection.  It is ONLY meant for local development/debugging — production
// builds must never emit it.
//   - Gate on the explicit `ANALYZE=true` opt-in flag.
//   - Hard-disable on production builds even if `ANALYZE=true` is set
//     (e.g. misconfigured CI).
//   - Skip on server builds (this plugin is client-side only).
// See README § "Build stats plugin" for details.

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
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
    // Documented allowed image sources (issue #1068). Unsplash hosts the
    // property photography used by mock/test data; the IPFS gateways below
    // serve on-chain property assets once they are minted. Only these hosts
    // are whitelisted — every other host keeps hitting Next/Image's 400
    // so the allow-list stays locked down.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "gateway.ipfs.io",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {},
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
      {
        source: "/properties/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=60, stale-while-revalidate=300, s-maxage=300",
          },
          {
            key: "Vary",
            value: "Accept-Encoding",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Content-Security-Policy is intentionally NOT set here. It used to
      // be a static policy that could diverge from the nonce-based policy
      // src/middleware.ts builds per-request (guarded by CSP_ENFORCE).
      // middleware.ts is now the single authoritative source for CSP.
    ];
  },
  webpack: (config, { isServer, webpack }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // Wallet SDKs are intentionally NOT aliased to `false`.
      // They are lazy-loaded via dynamic imports in useWalletConnector.ts
      // and the wallet connector modules under src/lib/walletConnectors/.
      // Setting them to `false` breaks wagmi connector detection and
      // prevents WalletConnect v2, Safe, Coinbase, and MetaMask connections.
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
          safe: {
            name: "safe-vendors",
            test: /[\\/]node_modules[\\/]@safe-global[\\/]/,
            chunks: "all",
            priority: 30,
          },
        },
      };
    }

    if (isAnalyzeEnabled && !isServer && !isProd) {
      class BuildStatsPlugin {
        apply(compiler: any) {
          compiler.hooks.done.tap("BuildStatsPlugin", (stats: any) => {
            const fs = require("fs");
            const path = require("path");
            const outputPath = path.join(
              compiler.options.output.path ?? ".next",
              "build-stats.json",
            );
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
                2,
              ),
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
