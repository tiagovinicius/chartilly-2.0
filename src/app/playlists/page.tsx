"use client";
import { useEffect, useState } from "react";

export default function PlaylistsPage(){
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{playlists: any[]; error?: string}>({playlists: []});

  useEffect(() => {
    fetch("/api/playlists").then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  }, []);

  return (
    <section style={{padding:16}} aria-labelledby="title">
      <h2 id="title">Your playlists</h2>
      {data.error && <p role="alert" style={{color:'crimson'}}>Error: {data.error}</p>}
      {loading ? (
        <ul className="space-y-3" aria-hidden="true" style={{listStyle:'none', padding:0}}>
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="animate-pulse" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{width:'60%'}}>
                <div className="bg-muted/30" style={{height:16, borderRadius:4, marginBottom:8}} />
                <div className="bg-muted/20" style={{height:12, width:'60%', borderRadius:4}} />
              </div>
              <div style={{display:'flex', gap:8}}>
                <div className="bg-muted/20" style={{height:32, width:80, borderRadius:6}} />
                <div className="bg-muted/20" style={{height:32, width:90, borderRadius:6}} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul style={{display:'grid', gap:12, listStyle:'none', padding:0}}>
          {data.playlists.map((p:any) => (
            <li key={p.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>{p.name}</div>
                <div style={{opacity:.6, fontSize:12}}>Tracks: {p.tracksTotal ?? 0}</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button aria-label={`Shuffle playlist ${p.name}`} onClick={async ()=>{ await fetch(`/api/playlists/${p.id}/shuffle`, {method:'POST'}); alert('Shuffled!'); }}>Shuffle</button>
                <button aria-label={`Rollback playlist ${p.name}`} onClick={async ()=>{ await fetch(`/api/playlists/${p.id}/rollback`, {method:'POST'}); alert('Rolled back!'); }}>Rollback</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
