import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework/version in response headers.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // `logMeal` is a Server Action that carries the compressed meal photo as a
      // base64 data URL. The default 1 MB action-body limit can reject larger
      // photos even though the analyze/estimate API routes accept them, so lift
      // it to cover the ~12 MB image cap enforced in scan-request / logMeal.
      bodySizeLimit: "13mb",
    },
  },
  // Conservative security headers on every response. Deliberately no
  // Content-Security-Policy yet — CSP needs its own careful pass so it doesn't
  // silently break inline styles/scripts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
