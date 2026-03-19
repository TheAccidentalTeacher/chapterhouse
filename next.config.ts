import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // imapflow and nodemailer use native Node.js net/tls — must not be bundled by Next.js
  serverExternalPackages: ["imapflow", "nodemailer"],
};

export default nextConfig;
