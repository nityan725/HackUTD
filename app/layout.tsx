import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RunwayProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Runway",
  description: "See a cash crunch before it happens, and fix it in one tap.",
  appleWebApp: { capable: true, title: "Runway", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RunwayProvider>
          {/* Phone-sized frame: full screen on a phone, centered "device" on a laptop */}
          <div className="relative mx-auto min-h-dvh max-w-[430px] bg-canvas sm:my-6 sm:h-[860px] sm:overflow-hidden sm:rounded-[44px] sm:shadow-2xl sm:ring-8 sm:ring-ink/90">
            <main className="px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)] sm:h-full sm:overflow-y-auto">{children}</main>
            <BottomNav />
          </div>
        </RunwayProvider>
      </body>
    </html>
  );
}
