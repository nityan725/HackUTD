import type { MetadataRoute } from "next";

// Makes Runway installable: "Add to Home Screen" opens it full screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Runway",
    short_name: "Runway",
    description: "See a cash crunch before it happens, and fix it in one tap.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#2742d6",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
