import type { MetadataRoute } from "next";

// Makes Kit installable: "Add to Home Screen" opens it full screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kit",
    short_name: "Kit",
    description: "Kit hears money trouble coming, and helps you fix it in one tap.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f8f7",
    theme_color: "#2AA79A",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
