Visão Geral

Ambiente de desenvolvimento no VS Code com DevContainer, Next.js 15 (App Router), APIs com arquitetura DDD, Supabase Cloud como banco remoto, GitHub Copilot, deploy na Vercel, e automação de CI para aplicar migrations na Cloud no merge para main.

Objetivos
• Fluxo “vibe coding” tipo Replit, porém com VS Code/DevContainer.
• Banco Supabase Cloud (sem stack local).
• APIs no App Router com DDD (biblioteca a definir p/ entidades/agregados/repos).
• Deploy contínuo via Vercel; Previews por PR.
• CI roda Supabase CLI para aplicar migrations no projeto cloud.

Requisitos Funcionais 1. DevContainer

    •	Base: node:20-bookworm.
    •	Pacotes: git, curl, unzip.
    •	(Opcional) pnpm via corepack.
    •	Sem montar /var/run/docker.sock.
    •	Sem --network=host.
    •	Sem supabase start.
    •	Extensões VS Code: GitHub.copilot, GitHub.copilot-chat, Supabase.vscode-supabase-extension, Supabase.postgrestools, dbaeumer.vscode-eslint, esbenp.prettier-vscode.
    •	Editor: autosave afterDelay 500ms, formatOnSave, ESLint.

    2.	Next.js 15 + App Router

    •	Estrutura em src/app.
    •	Rotas app/api/.../route.ts.
    •	Integração Supabase JS client usando URL e ANON KEY da Cloud.

    3.	Arquitetura DDD nas APIs

    •	Camadas: domain/ (entidades, value objects, regras), application/ (use cases), infrastructure/ (repos Supabase, mapeamentos), interfaces/ (handlers do App Router).
    •	Lib DDD (exemplos): ts-ddd, domain-driven, ou base “hand-rolled” com tipos utilitários (à sua escolha).

    4.	Migrations & CI

    •	Pasta supabase/migrations/*.sql.
    •	GitHub Actions:
    •	Instala Supabase CLI (binário).
    •	supabase link --project-ref $SUPABASE_PROJECT_ID.
    •	supabase db push no merge para main.

    5.	Ambientes & Deploy

    •	Vercel: Preview por PR; Production em main.
    •	Variáveis de ambiente:
    •	NEXT_PUBLIC_SUPABASE_URL (Cloud)
    •	NEXT_PUBLIC_SUPABASE_ANON_KEY (Cloud)
    •	Secrets do GitHub Actions:
    •	SUPABASE_PROJECT_ID (ref do projeto)
    •	SUPABASE_DB_PASSWORD
    •	SUPABASE_ACCESS_TOKEN (token do CLI)

Requisitos Não Funcionais
• Simplicidade (sem dependência de Docker no DevContainer).
• Compatível com Linux/macOS/Windows.
• Documentação de “como rodar” e “como deployar”.

Critérios de Aceite
• Abrir no VS Code → DevContainer pronto, pnpm dev sobe o Next.
• App se conecta ao Supabase Cloud (requisições OK).
• CI aplica migrations na Cloud ao mergear.
• Estrutura DDD clara e funcional (domain/app/infra/interfaces).

Arquivos/trechos esperados (resumo)
• .devcontainer/devcontainer.json (sem mounts de docker; settings e extensões).
• .devcontainer/Dockerfile (Node 20 + utilitários + pnpm opcional).
• .github/workflows/supabase-migrations.yml (CLI + db push).
• src/app/api/.../route.ts (handlers chamando casos de uso DDD).
• src/lib/supabase-client.ts (createClient com env da Cloud).
• supabase/migrations/\*.sql.
• .env.example (somente as chaves da Cloud).
