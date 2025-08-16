"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function OnboardingPage(){
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/playlists";
  const [accepted, setAccepted] = useState(false);

  return (
    <main style={{padding:16}}>
      <h1>Welcome to chartilly</h1>
      <p>Precisamos do seu consentimento para processar dados de playlists, tokens do Spotify/Last.fm e estatísticas de uso conforme LGPD.</p>
      <label style={{display:'flex', gap:8, alignItems:'center', marginTop:16}}>
        <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} />
        <span>Concordo com o uso de dados conforme descrito.</span>
      </label>
      <div style={{marginTop:16}}>
        <button disabled={!accepted} onClick={()=>{
          document.cookie = `consent=1; path=/; max-age=${60*60*24*365}`;
          router.push(next);
        }}>Continue</button>
      </div>
    </main>
  );
}
