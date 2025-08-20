"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400", display: "swap" });

function OnboardingInner(){
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp?.get("next") || "/playlists";
  const [accepted, setAccepted] = useState(false);

  return (
    <main style={{padding:16}}>
      <h1>
        Welcome to <span className={pacifico.className} style={{ color: "hsl(var(--primary))", fontSize: "clamp(24px, 6vw, 40px)" }}>chartilly</span>
      </h1>
      <p>We need your consent to process playlist data, Spotify/Last.fm tokens, and usage statistics in accordance with applicable data protection laws.</p>
      <label style={{display:'flex', gap:8, alignItems:'center', marginTop:16}}>
        <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} />
        <span>I agree to the processing of my data as described.</span>
      </label>
      <div style={{marginTop:16, display:'flex', justifyContent:'flex-end'}}>
        <Button disabled={!accepted} onClick={()=>{
          document.cookie = `consent=1; path=/; max-age=${60*60*24*365}`;
          router.push(next);
        }}>Continue</Button>
      </div>
    </main>
  );
}

export default function OnboardingPage(){
  return (
    <Suspense fallback={<main style={{padding:16}}><div className="skeleton h-8 w-40" aria-hidden /><div className="mt-4 skeleton h-20 w-full" aria-hidden /></main>}>
      <OnboardingInner />
    </Suspense>
  );
}
