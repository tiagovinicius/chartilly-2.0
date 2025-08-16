"use client";
import React from "react";

export default function LoginPage(){
  return (
    <main style={{padding:16}}>
      <h1>Login</h1>
      <p>Entre com sua conta Spotify para continuar.</p>
      <button onClick={() => { window.location.href = "/api/auth/spotify/start"; }}>Continue with Spotify</button>
    </main>
  );
}
