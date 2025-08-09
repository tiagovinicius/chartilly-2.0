# My Vibe App — Next.js + Supabase + DevContainer

## O que vem pronto
- Next.js + TypeScript
- Supabase (client no app) e migrations em `supabase/migrations`
- DevContainer com:
  - GitHub Copilot + Copilot Chat
  - CodeGPT (lendo API key da variável CODEGPT_API_KEY)
  - Autosave ativado
- GitHub Actions: aplica migrations no merge para `main`
- Pronto para deploy na Vercel (Preview por PR + Production no `main`)

## Passos rápidos
1. **Crie o arquivo** `.devcontainer/.env` com:
   ```env
   CODEGPT_API_KEY=coloque_sua_chave_openai
   ```

2. **Abra no VS Code** → *Reopen in Container*.
3. **Instale deps** (o container já roda `pnpm install`): `pnpm dev` para desenvolvimento.
4. **Vercel**: adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas *Environment Variables* do seu projeto.
5. **GitHub Secrets** (Repo → Settings → Secrets and variables → Actions):
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_ACCESS_TOKEN` (token do Supabase CLI)
6. Abra PR → merge em `main` → a Action roda `supabase db push` e aplica migrations.
