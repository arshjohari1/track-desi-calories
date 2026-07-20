import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // `logMeal` is a Server Action that carries the compressed meal photo as a
      // base64 data URL. The default 1 MB action-body limit can reject larger
      // photos even though the analyze/estimate API routes accept them, so lift
      // it to cover the ~12 MB image cap enforced in scan-request / logMeal.
      bodySizeLimit: "13mb",
    },
  },
};

export default nextConfig;
