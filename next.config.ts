import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.2.2', '192.168.0.103'],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow Supabase storage URLs in iframes for PDF preview
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.tailwindcss.com https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
              // Allow Supabase storage URLs to be embedded in iframes
              "frame-src 'self' https://*.supabase.co https://ijxcwrwyzqdkmumjbqzt.supabase.co blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
              "worker-src 'self' blob:",
              "object-src blob: https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
