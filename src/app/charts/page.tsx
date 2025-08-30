"use client";
import { Button } from "@/components/ui/button";
import { Music, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ChartsPage() {
  return (
    <section className="p-4 space-y-6" aria-labelledby="title">
      <h1 id="title" className="mt-4 text-2xl md:text-3xl font-bold text-center pb-4 text-[hsl(var(--secondary-foreground))]">
        Charts
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Escolha qual chart você quer sincronizar
      </p>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {/* Weekly Top 50 */}
        <Link href="/charts/top50">
          <div className="group relative overflow-hidden rounded-lg border p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  Weekly Top 50
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Suas 50 músicas mais ouvidas dos últimos 7 dias
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Atualizado semanalmente</span>
              </div>
            </div>
          </div>
        </Link>

        {/* I Love Mondays */}
        <Link href="/charts/ilovemondays">
          <div className="group relative overflow-hidden rounded-lg border p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Music className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold group-hover:text-blue-500 transition-colors">
                  I Love Mondays
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top 100 músicas desde a segunda-feira passada
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Atualizado diariamente</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Cada chart sincroniza automaticamente com suas playlists do Spotify com base nos seus dados do Last.fm
        </p>
      </div>
    </section>
  );
}
