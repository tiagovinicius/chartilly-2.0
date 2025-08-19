"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, ListMusic, BarChart2 } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";
  const isPlaylists = pathname.startsWith("/playlists");
  const isCharts = pathname.startsWith("/charts");

  const bgStyle: React.CSSProperties = {
    backgroundColor: "hsl(var(--secondary))",
    boxShadow: "0 -6px 12px rgba(0,0,0,0.12)",
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-around"
      role="navigation"
      aria-label="Primary"
      style={bgStyle}
    >
      <Link href="/" aria-label="Home" className="relative flex-1 grid place-items-center p-2" aria-current={isHome ? "page" : undefined}>
        {isHome && <span aria-hidden className="pointer-events-none absolute -top-2 left-0 right-0 h-[3px] bg-[hsl(var(--primary))]" />}
        <HomeIcon className="w-6 h-6 text-[hsl(var(--primary))]" />
        <span className="sr-only">Home</span>
      </Link>
      <Link href="/playlists" aria-label="My playlists" className="relative flex-1 grid place-items-center p-2" aria-current={isPlaylists ? "page" : undefined}>
        {isPlaylists && <span aria-hidden className="pointer-events-none absolute -top-2 left-0 right-0 h-[3px] bg-[hsl(var(--primary))]" />}
        <ListMusic className="w-6 h-6 text-[hsl(var(--primary))]" />
        <span className="sr-only">My playlists</span>
      </Link>
      <Link href="/charts" aria-label="Charts" className="relative flex-1 grid place-items-center p-2" aria-current={isCharts ? "page" : undefined}>
        {isCharts && <span aria-hidden className="pointer-events-none absolute -top-2 left-0 right-0 h-[3px] bg-[hsl(var(--primary))]" />}
        <BarChart2 className="w-6 h-6 text-[hsl(var(--primary))]" />
        <span className="sr-only">Charts</span>
      </Link>
    </nav>
  );
}
