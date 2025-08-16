"use client";
import React from "react";

export default function ConnectLastFm(){
  function start(){
  const next = new URLSearchParams({ next: "/magic" }).toString();
    window.location.href = `/api/auth/lastfm/start?${next}`;
  }
  return (
    <main style={{padding:16}}>
  <h1>Connect Last.fm</h1>
  <p>Connect your Last.fm account to enable the Weekly Top 50.</p>
  <button onClick={start}>Connect with Last.fm</button>
    </main>
  );
}
