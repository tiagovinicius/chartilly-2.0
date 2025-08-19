import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SwRegister from "./sw-register";
import { Inter, Poppins } from "next/font/google";
import BottomNav from "./bottom-nav";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap", variable: "--font-poppins" });

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
  <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-background text-foreground`}>
        <a href="#main" className="skip-link">Skip to content</a>
        <SwRegister />
  <main id="main" role="main" className="pb-20">{children}</main>
  <BottomNav />
      </body>
    </html>
  );
}
