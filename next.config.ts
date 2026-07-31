import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In its default bottom-left corner the dev overlay badge sits right on top of
  // the transport bar's play button, making it unclickable while developing.
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;
