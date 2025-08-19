import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerSpotifyId = req.cookies.get("session")?.value;
  if (!ownerSpotifyId) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("shuffle_versions")
    .select("id, created_at")
    .eq("playlist_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, history: data ?? [] });
}
