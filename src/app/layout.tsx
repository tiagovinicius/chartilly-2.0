import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SwRegister from "./sw-register";

export const metadata: Metadata = {
  title: "chartilly",
  description: "Smart shuffle & weekly Top 50 for your Spotify playlists",
  applicationName: "chartilly",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icons/icon-192.png" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.png" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <a href="#main" className="skip-link">Skip to content</a>
        <SwRegister />
        <main id="main" role="main" className="pb-20">{children}</main>
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t px-2 py-2 flex gap-2"
          role="navigation"
          aria-label="Primary"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          <Link href="/playlists" className="flex-1 rounded-md border px-3 py-2 text-center">Your playlists</Link>
          <Link href="/charts" className="flex-1 rounded-md border px-3 py-2 text-center">Charts</Link>
        </nav>
      </body>
    </html>
  );
}
