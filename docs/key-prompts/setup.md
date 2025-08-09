Crie um setup de desenvolvimento no VS Code usando DevContainer, com:

- Next.js 15 com App Router
- APIs com arquitetura DDD (camadas domain/application/infrastructure/interfaces; pode usar lib DDD ou base própria)
- Supabase **Cloud** (sem Supabase local e sem docker-compose)
- GitHub Copilot
- Deploy na Vercel com Preview por PR e Prod no main
- CI no GitHub Actions que instala o Supabase CLI (binário) e roda `supabase db push` no merge para main

Exigências:

- DevContainer baseado em node:20-bookworm; instalar git/curl/unzip; (opcional) pnpm via corepack
- Não montar docker.sock e não usar `--network=host`
- Editor com autosave (500ms), formatOnSave, ESLint e Prettier
- Extensões VS Code: Copilot, Copilot Chat, Supabase extensions, ESLint, Prettier
- `src/lib/supabase-client.ts` usando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Cloud)
- Estrutura DDD: `src/domain`, `src/application`, `src/infrastructure`, `src/interfaces` (App Router em `src/app/api/*`)
- Pasta `supabase/migrations` com exemplo inicial
- Workflow `.github/workflows/supabase-migrations.yml` que:
  - baixa binário do Supabase CLI (release GitHub)
  - `supabase link --project-ref $SUPABASE_PROJECT_ID`
  - `supabase db push` (usar secrets: SUPABASE_PROJECT_ID, SUPABASE_DB_PASSWORD, SUPABASE_ACCESS_TOKEN)

Entregáveis:

- devcontainer.json + Dockerfile do DevContainer
- supabase-migrations.yml
- supabase-client.ts
- .env.example (URL e ANON KEY da Cloud)
- Estrutura DDD mínima e exemplo de handler em App Router
- README com instruções para rodar local (pnpm dev), configurar envs na Vercel e secrets no GitHub
