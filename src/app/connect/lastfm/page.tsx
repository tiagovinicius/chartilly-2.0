"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400", display: "swap" });

export default function ConnectLastFm(){
  function start(){
  const next = new URLSearchParams({ next: "/" }).toString();
    window.location.href = `/api/auth/lastfm/start?${next}`;
  }
  return (
    <section className="relative min-h-screen">
      {/* Centered brand logo behind sheet */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className={pacifico.className} style={{
          color: "hsl(var(--primary))",
          fontSize: "clamp(48px, 11vw, 108px)",
          fontWeight: 900,
          letterSpacing: "normal",
          lineHeight: 1,
        }}>chartilly</div>
      </div>
      <Sheet open>
        <SheetContent>
          <h1 className="text-xl font-bold mb-2">Connect Last.fm</h1>
          <p className="text-sm text-muted-foreground">Connect your Last.fm account to enable the Weekly Top 50.</p>
          <div className="mt-4 flex justify-end">
            <Button size="lg" onClick={start}>Connect with Last.fm</Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
