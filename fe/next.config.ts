import type { NextConfig } from "next";

const FE_DOMAIN = process.env.NEXT_PUBLIC_FE_DOMAIN || "http://localhost:3000";
const BE_DOMAIN =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const S3_DOMAINS =
  "https://s3.amazonaws.com https://*.s3.amazonaws.com https://*.s3.ap-southeast-1.amazonaws.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self';`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${FE_DOMAIN};`,
      `style-src 'self' 'unsafe-inline';`,
      `img-src 'self' data: blob: ${S3_DOMAINS}`,
      `font-src 'self' data:;`,
      `connect-src 'self' ${BE_DOMAIN} ${FE_DOMAIN} ws: wss: ${S3_DOMAINS};`,
      `frame-ancestors 'none';`,
      `form-action 'self';`,
      `base-uri 'self';`,
      `object-src 'none'; media-src 'self' data:;`,
    ].join(" "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (process.env.USE_MOCK === "true") {
      return [
        {
          source: "/api/contact-admin",
          destination: "/api/mock/contact-admin",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
