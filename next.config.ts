import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
// if (process.env.NODE_ENV !== "production" && !process.env.DOCKER_BUILD) {
//   try {
//     const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
//     initOpenNextCloudflareForDev();
//   } catch (e) {}
// }
