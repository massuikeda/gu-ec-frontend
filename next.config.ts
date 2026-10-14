import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Azure App Service 用：動かすのに必要な最小限のファイルだけを .next/standalone に出力する
  output: "standalone",
};

export default nextConfig;
