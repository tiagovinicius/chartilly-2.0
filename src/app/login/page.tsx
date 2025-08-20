"use client";
import React from "react";
import { Pacifico } from "next/font/google";
import { Button } from "@/components/ui/button";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400", display: "swap" });

export default function LoginPage(){
  return (
    <section className="min-h-[calc(100vh-5rem)] grid place-items-center px-4">
      <div className="text-center space-y-8">
        <div className={pacifico.className} style={{
          color: "hsl(var(--primary))",
          fontSize: "clamp(48px, 11vw, 108px)",
          fontWeight: 900,
          letterSpacing: "normal",
          lineHeight: 1,
        }}>chartilly</div>
        <div className="flex justify-center">
          <Button size="lg" className="gap-2" onClick={() => { window.location.href = "/api/auth/spotify/start"; }}>
            <span>Continue with</span>
            <img src="/spotify-logo-white.png" alt="" aria-hidden="true" className="h-5 w-auto" />
          </Button>
        </div>
      </div>
    </section>
  );
}
