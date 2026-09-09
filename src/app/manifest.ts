import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deuxly",
    short_name: "Deuxly",
    description: "The second look at your skin — properly framed.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F7F4",
    theme_color: "#C6B8A4",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
