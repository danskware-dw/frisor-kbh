import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    // Gallery and treatment images live in Supabase Storage. Serving them through
    // the Next.js optimizer resizes them and caches the result, so Supabase egress
    // is paid roughly once per image instead of once per visitor.
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Uploaded files get a new random filename, so a long cache never serves stale images.
    minimumCacheTTL: 2678400, // 31 days
  },
};

export default nextConfig;
