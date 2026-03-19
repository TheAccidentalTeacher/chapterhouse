import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // imapflow, nodemailer, and mailparser use native Node.js — must not be bundled by Next.js
  serverExternalPackages: ["imapflow", "nodemailer", "mailparser"],
};

export default nextConfig;
