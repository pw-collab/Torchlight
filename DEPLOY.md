# Deploy — Torchlight (Shadowdark VTT)

## Status (via Cursor MCP)

| Etapa | Status |
|-------|--------|
| Projeto Supabase `torchlight` (`duidhsevhpcppmszdlaj`) | ✅ Criado (sa-east-1) |
| Migração `001_initial` + allowlist (7 usuários) | ✅ Aplicado |
| Vercel deploy + env vars | ⏳ Importar repo e colar variáveis abaixo |
| Discord OAuth no Supabase | ⏳ Ativar no painel (passo 1) |

**URL Supabase:** `https://duidhsevhpcppmszdlaj.supabase.co`

## 1. Supabase — Discord OAuth (manual)

1. **Authentication → Providers → Discord**: ative e configure com uma app em [Discord Developer Portal](https://discord.com/developers/applications).
   - Redirect URL do Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Authentication → URL Configuration**:
   - Site URL: `https://<seu-dominio-vercel>`
   - Redirect URLs: `https://<seu-dominio-vercel>/auth/callback`, `http://localhost:3000/auth/callback`
5. Copie em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (opcional; o app usa só anon hoje)

## 2. Vercel

1. Importe o repositório [pw-collab/Torchlight](https://github.com/pw-collab/Torchlight) em [vercel.com/new](https://vercel.com/new).
2. Framework: **Next.js** (detectado automaticamente).
3. **Environment variables** (Production + Preview):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `DISCORD_WEBHOOK_URL` | URL do webhook do canal **Rolagens SD** |

> Não commite o webhook no Git. Configure só no painel da Vercel.

4. Deploy. Anote a URL (`https://torchlight-….vercel.app`).
5. Volte ao Supabase e atualize **Site URL** e **Redirect URLs** com a URL final da Vercel.

## 3. Discord (já configurado)

- Webhook: canal **Rolagens SD** (eventos de rolagem, HP, tocha, sessão).
- GM: `181957483361730560`
- Jogadores: demais IDs em `supabase/seed_allowed_users.sql`

## 4. Verificação

1. Abra `/login` → **Entrar com Discord** (conta na allowlist).
2. Crie um personagem em `/character-creator`.
3. Role um dado na ficha → mensagem no Discord.
4. GM (`181957483361730560`) acessa `/gm` e inicia uma sessão.

## Local

```bash
cp .env.local.example .env.local
# Preencha as variáveis
npm install
npm run dev
```
