# Aurum Investimentos

Plataforma brasileira que junta tracking de carteira, agenda de dividendos,
finanças pessoais, cursos estruturados e uma comunidade de investidores
em um único lugar. Construído para quem prefere método a promessas, e
tempo a atalhos.

Veja [PRODUCT.md](./PRODUCT.md) para o registro estratégico (público,
propósito, princípios, anti-referências) e [DESIGN.md](./DESIGN.md) para
o sistema visual.

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (auth + DB + storage)
- [brapi](https://brapi.dev) (cotações B3, FIIs, criptos)
- [Stripe](https://stripe.com) (assinaturas)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Sonner](https://sonner.emilkowal.ski) (toasts)
- [cmdk](https://cmdk.paco.me) (command palette `Ctrl+K`)
- [Recharts](https://recharts.org) (visualizações)
- TypeScript estrito + ESLint + Prettier

## Setup local

1. Clone o repo e instale:
   ```bash
   git clone https://github.com/joaozee/aurum-insights
   cd aurum-insights
   npm install
   ```

2. Crie `.env.local` com:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   BRAPI_TOKEN=...
   STRIPE_SECRET_KEY=...
   STRIPE_PUBLISHABLE_KEY=...
   ```

3. Rode em dev:
   ```bash
   npm run dev
   ```

   Abre em [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Dev server com Turbopack |
| `npm run build` | Build de produção |
| `npm run start` | Start produção (após build) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Estrutura

```
app/                  Next.js App Router
  (auth)/             Login, register, forgot-password
  api/                Route handlers (brapi, market, etc)
  dashboard/          Área autenticada
    acoes/            Mercado, busca de tickers, FIIs
    carteira/         Tracking de ativos
    comunidade/       Feed de posts, mensagens, rede
    configuracoes/    Conta + suporte
    cursos/           Catálogo + aulas
    financas/         Receitas/despesas, metas, eventos
    perfil/           Perfil próprio + público (/perfil/[username])
    sobre/            Manifesto + princípios
components/           Componentes da app
  ui/                 shadcn/ui + customizações Aurum
  CommandPalette.tsx  Ctrl+K palette
  Navbar.tsx
lib/
  aurum-colors.ts     Tokens TS (mirror do globals.css)
  supabase/           Client (browser + server)
  comunidade.ts       Tipos e helpers da comunidade
  cursos-data.ts      Catálogo estático de cursos
public/               Assets (logo, selo, manifest)
PRODUCT.md            Registro estratégico
DESIGN.md             Sistema visual
AURUM_CRITIQUE.md     Relatório /impeccable critique
```

## Deploy

Push em `main` aciona auto-deploy na Vercel
(`https://aurum-app-kappa.vercel.app`).

## Convenções

- Inline `style={...}` é legacy do migration Vite → Next; novo código usa
  Tailwind + tokens. Veja [DESIGN.md](./DESIGN.md) para a paleta semântica.
- Hover é via CSS `:hover` (`.aurum-hover-*` utilities em `globals.css`),
  nunca via `onMouseEnter`.
- Dark mode é o tema base; sem switcher por enquanto.
- Tons de texto seguem WCAG AA mínimo (4.5:1 em corpo).

## Licença

Privado.
