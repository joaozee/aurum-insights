# Aurum — Critique completa

Avaliação consolidada do app a partir de PRODUCT.md, DESIGN.md, leitura
do código (`app/`, `components/`, `lib/`) e mapeamento determinístico de
anti-patterns. Sem visita ao live (rota `/dashboard` é auth-gated).

---

## 1. Health Score (Nielsen)

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibility of System Status | **2/4** | "Carregando..." em texto plano em vez de skeletons; sem feedback durante async (upload, follow, save) |
| 2 | Match System / Real World | **3/4** | PT-BR consistente, BRL/B3/IBOV bem tratados, datas em pt-BR. Bom |
| 3 | User Control and Freedom | **2/4** | Sem undo/redo; trash icon só aparece no hover (mobile inacessível); modal close apenas via X |
| 4 | Consistency and Standards | **1/4** | 5 darks, 14 sizes, 12 radii, 11 verdes/vermelhos diferentes; 4 implementações de botão; 0 design system |
| 5 | Error Prevention | **2/4** | Validação básica em forms; trash sem confirm; conta empresa/pessoal misturável |
| 6 | Recognition Rather Than Recall | **3/4** | Lucide bem aplicado; ticker logos via brapi; `NivelTooltip` é exemplar |
| 7 | Flexibility and Efficiency | **1/4** | Zero keyboard shortcuts; cmdk instalado mas inerte; sem batch ops; busca decente |
| 8 | Aesthetic and Minimalist Design | **2/4** | Direção warm-dark+ouro acertada, mas executada maximalista: gradient text, glass, círculos decorativos, 4 gradients vibrantes coexistindo. Não é minimalist |
| 9 | Error Recovery | **1/4** | Falhas vão pra `console.error`; nenhum erro UI visível ao usuário; `try/catch` engole exceção |
| 10 | Help and Documentation | **2/4** | Rotas `/ajuda`, `/termos`, `/privacidade` existem (referenciadas em ProfileContent); `NivelTooltip` excelente; Carteira/Finanças sem ajuda inline |
| **Total** | | **19/40** | **Banda: "Needs significant work"** |

Honest read: o produto tem ambição premium real, mas a execução visual e de
sistema fica num plano abaixo do que a copy da Sobre promete. Polir 19→28
é viável em um trimestre se a refatoração for por camadas.

---

## 2. Anti-Patterns Verdict

### 2.1 LLM Assessment — parece feito por IA?

**Sim, em primeiro grau e em segundo grau.**

- **Primeiro grau** (categoria → reflexo): "fintech / investimentos" → palette
  default da IA é exatamente *dark + gold*. Aurum cai cravado nisso. Alguém
  olhando 1.5s e não-experimentado consegue prever a paleta a partir do nome
  do produto.
- **Segundo grau** (categoria + anti-refs → reflexo): O usuário rejeitou
  "fintech roxa-laranja gamificada" e "SaaS B2B indigo genérico". O reflexo
  IA pra essa rejeição é *editorial-luxury com Playfair + ouro saturado +
  preto* — exatamente o que está em produção. O segundo reflexo também não
  foi desviado.

Sintomas do AI slop visíveis no código:

- Gradient text em saudação ("Boa noite, {name}" com gradiente ouro→bronze)
- 4 cards idênticos no "Acesso Rápido" da Home, cada um com gradiente saturado
  diferente (azul, ciano, roxo, verde), seguindo template SaaS hero-feature
- 3 cards idênticos com ícone+label+texto na Sobre (Missão/Visão/Valores)
- 4 cards idênticos com ícone+label+texto na Sobre (Diferenciais)
- "Hero metric" template na Home (greeting headline + supporting text + market
  card on right)
- Decorative circles em todos os cards do Quick Access (`width: 100px,
  bottom: -24px, right: -24px, background: rgba(255,255,255,0.08)`)
- Radial-gradient halos no fundo do hero da Home
- Glass blur (`backdrop-filter`) em 7 lugares como decoração
- Avatar default em gradiente roxo (`#8b5cf6, #6d28d9`) num app de tema dourado
- "Premium" badge com ícone Crown — perfeito clichê SaaS
- Bestseller badge em gradiente roxo `#8b5cf6→#6d28d9` na página de Cursos
- Sobre CTA em gradiente roxo `#1a0f2e→#130f1a→#0f1520` com border `#8b5cf6` —
  brand inversion completa numa página *sobre a marca*

### 2.2 Detecção determinística (varredura `app/`)

| Item | Contagem | Severidade |
|---|---|---|
| `style={{` literais | **1492** em 17 arquivos | Anti-pattern de manutenção |
| `className=` (Tailwind) | **65** em 4 arquivos | 22.9× menos que inline styles |
| `onMouseEnter` (hover via JS) | **1210** em 18 arquivos | Quebra em touch e foco |
| `linear-gradient` | **74** em 16 arquivos | Decoração excessiva |
| Hex literals (`#XXXXXX`) | **741** em 24 arquivos | Zero tokens de design |
| `backdrop-filter` (glass) | **7** em 6 arquivos | Decorativo, não funcional |
| `border-left`/`border-right` colorido | **4** | **BAN ABSOLUTO violado** |
| Gradient text (`WebkitBackgroundClip: "text"`) | **2** | **BAN ABSOLUTO violado** |
| Identical card grids | **4** seções (Home Quick Access, Sobre MVV, Sobre Diferenciais, Profile Settings dual) | **BAN ABSOLUTO violado** |
| Hero-metric template | **2** seções (Home hero, Profile pontos totais) | **BAN ABSOLUTO violado** |

Localizações exatas dos bans:

```
GRADIENT TEXT (ban):
  app/dashboard/HomeContent.tsx:206  greeting name
  app/dashboard/perfil/ProfileContent.tsx:509  tier name (Bronze/Prata/Ouro/Platina)

SIDE-STRIPE BORDERS (ban):
  app/dashboard/carteira/CarteiraContent.tsx:1702  1px stripe entre stat cells
  app/dashboard/carteira/CarteiraContent.tsx:1777  3px stripe verde/vermelho em transação
  app/dashboard/financas/FinancasContent.tsx:1568  2px stripe colorido em categoria
  app/dashboard/comunidade/mensagens/MensagensContent.tsx:194  1px stripe na sidebar

GLASS DECORATIVO:
  app/dashboard/HomeContent.tsx:237  market card com blur 8px
  app/dashboard/perfil/ProfileContent.tsx:927  HeaderBtn com blur 8px
  app/dashboard/carteira/CarteiraContent.tsx:2189  blur 8px
  app/dashboard/financas/FinancasContent.tsx:1633  modal overlay com blur 4px (OK funcional)
  app/dashboard/comunidade/ComunidadeContent.tsx:1237,1358  modais com blur 4px (OK)
  app/dashboard/comunidade/mensagens/MensagensContent.tsx:379  blur 4px modal
```

### 2.3 Ban da Tailwind-500 invasion (não está na lista canônica mas é tão grave quanto)

`CarteiraContent.tsx` linha 123-134:
```ts
const PALETTE = ["#8b5cf6","#3b82f6","#0ea5e9","#06b6d4","#14b8a6",
                 "#22c55e","#eab308","#f97316","#ef4444","#ec4899"];
```

`FinancasContent.tsx` linha 71-90:
```ts
const CATEGORY_COLORS = { Alimentação: "#f59e0b", Transporte: "#3b82f6",
  Moradia: "#8b5cf6", Saúde: "#ec4899", Educação: "#06b6d4", ... };
```

A paleta literal Tailwind 400-500 dentro de um app que se propõe luxo
editorial dourado. No instante em que dado vira chart, a marca evapora.
Esse é o problema mais visível e mais consertável.

---

## 3. Overall Impression

**O Aurum tem uma tese de marca muito mais sofisticada do que a tese de
design system.** A copy da Sobre ("Fundado em valor. Construído para durar.",
"dinheiro é uma ferramenta, não um destino") promete um produto pra investidor
sério. A execução visual entrega um SaaS dressed-up: 1492 inline styles, 4
implementações de botão, 11 verdes diferentes, paleta de chart Tailwind
default, gradient text, glass decorativo.

A aposta dourada-com-Playfair é defensável (e o usuário a quer), mas só
funciona se for **comprometida e disciplinada**. Hoje ela é decorativa
("ouro como gilt em todo lugar") e se contradiz constantemente (cards roxos,
gradientes ciano, bestseller púrpura, paleta Tailwind nas charts).

A boa notícia: o conserto é mais fácil do que parece. Há um único insight
arquitetural que destrava 70% dos problemas: **ativar o shadcn que já está
declarado em `components.json` mas nunca foi instalado no `components/ui/`
do App Router**. Com o sistema de componentes vivo, as 1492 inline styles
viram ~15 componentes com variants, e qualquer mudança visual passa a
ser um swap de tokens.

A maior oportunidade: **escolher uma direção estética e cumpri-la**.
A combinação atual está num limbo entre "warm-dark editorial" e "SaaS
hero-metric" e nenhum dos dois é executado direito. Direção A (sharpen
the gold), B (editorial-typographic light), ou C (terminal-native) — todas
estão em DESIGN.md. Recomendação: A pra v1.5, com B ou C planejado pra
v2.0 quando os tokens estiverem firmes.

---

## 4. What's Working

Três coisas que o app faz bem e devem ser **preservadas** ao refatorar:

- **A copy da Sobre é genuinamente boa.** "O Grupo Aurum nasceu da crença
  de que dinheiro é uma ferramenta, não um destino." / "Aqui você não
  encontra promessas de enriquecimento rápido. Encontra método, profundidade
  e uma comunidade que pensa diferente sobre o futuro." / "Fundado em valor.
  Construído para durar." Essa voz é mentor calmo + sócio direto exatamente
  como descrito em PRODUCT.md. A copy é o ativo de marca mais forte do app
  hoje, mais forte que a estética.

- **`NivelTooltip` em `ProfileContent.tsx:1190`** é o melhor componente do
  repo do ponto de vista de "Educa antes de pedir" (Princípio 1 de
  PRODUCT.md). Mostra exatamente quanto XP cada ação dá, lista os tiers,
  abre on-hover-and-focus, com `aria-label`. **Replicar esse padrão** em
  Carteira (explicar DY, P/L, Yield on Cost), Ações (explicar Ibovespa,
  S&P 500), Finanças (explicar saldo do mês, categorias).

- **Estrutura de dados e integração brapi** está bem-feita. Revalidate de
  300s na home, headers com Authorization Bearer, cache via Next.js, fallback
  em catch. `lib/comunidade.ts` separa formatRelativeTime e initialFromName
  como utilitários. A camada de dados é mais madura que a camada de UI.

---

## 5. Priority Issues

### P0 — bloqueadores de qualidade

#### P0-1. Crise de contraste de leitura
**O quê.** Quatro tons cinza-dourados (`#4a3a1a`, `#5a4a2a`, `#6a5a3a`,
`#7a6a4a`) aparecem em dezenas de lugares onde o usuário precisa ler:
preços, labels secundários, hints de empty state, eixos de chart. Todos
falham WCAG AA (contraste 1.7:1 a 3.7:1 sobre `#0a0806`).

**Por que importa.** Investidores leem números à noite, com olhos cansados,
em telas variadas. Texto faint impede a tarefa principal. Mesmo sem
auditoria AA formal, isso aparece como "o app é bonito mas eu me canso
rápido lendo".

**Fix.** Reescrever a escala de muted text para 3 tons que passam AA
(`--text-body` `#c8b89a`, `--text-muted` `#a09068`, `--text-faint` mínimo
`#8d7a5e`). Banir `#4a3a1a`-`#7a6a4a` como cor de texto. Replace via
`Edit replace_all` por `var(--text-muted)`.

**Comando.** `/impeccable colorize` (parte de tokens) + `/impeccable adapt`
(passar todas as superfícies pelo audit).

---

#### P0-2. Quatro side-stripes + duas gradient texts (bans absolutos)
**O quê.** Seis violações dos bans absolutos do impeccable:
- `CarteiraContent:1702,1777` — stripes 1px e 3px
- `FinancasContent:1568` — stripe 2px
- `MensagensContent:194` — stripe 1px
- `HomeContent:206` — gradient text na saudação
- `ProfileContent:509` — gradient text no tier name

**Por que importa.** Side-stripes são o tell visual de "callout improvisado"
mais identificado com IDEs antigos e dashboards genéricos. Gradient text
em nome próprio (saudação) sempre lê como ad-hoc, especialmente quando o
cabeçalho usa Playfair, que já carrega autoridade tipográfica.

**Fix.** Remover. Substituir por:
- Side-stripe em transação (compra/venda) → ícone leading + cor de texto
  na quantia (já existe! Os `+` e `-` em `TxRow`)
- Side-stripe em categoria de finanças → bullet de cor, não barra
- Side-stripe em sidebar de mensagens → border completo ou background
- Gradient text em saudação → cor sólida `var(--text-strong)` + Playfair
  600 já cria peso suficiente
- Gradient text em tier name → cor sólida do tier, weight 700

**Comando.** `/impeccable polish` direcionado.

---

#### P0-3. Paleta Tailwind-500 invade as charts
**O quê.** `CarteiraContent` e `FinancasContent` usam a Tailwind-500 default
como paleta de categoria/ticker/setor. 11+ hues vibrantes saturados num
app que se propõe ouro-editorial-dark.

**Por que importa.** É o momento exato em que a marca quebra. Donut chart
com 8 fatias roxa/ciano/laranja/rosa dentro de um card dourado é cognitive
dissonance. Investidor avançado nota. Investidor iniciante associa o app
a "um dashboard a mais".

**Fix.** Substituir `PALETTE`, `CLASS_COLORS`, `SECTOR_COLORS`,
`CATEGORY_COLORS`, `EVENT_TYPE_COLORS` por uma única chart palette de 8
hues no mesmo banda de luminosidade (ver DESIGN.md §2.2). Centralizar em
`lib/chart-colors.ts`.

**Comando.** `/impeccable colorize` específico para data viz.

---

### P1 — alta prioridade

#### P1-1. Sistema de design ausente apesar de declarado
**O quê.** `components.json` declara shadcn, Tailwind config define `gold.*`
e fonts, mas `components/ui/` não existe no App Router. 1492 inline styles,
65 className. Cada card é re-implementado por mão.

**Por que importa.** Toda mudança visual hoje é refactor de 24 arquivos.
Token swap impossível. Anti-padrão duplica bugs (ex: 4 darks diferentes
porque ninguém está sincronizando).

**Fix.** `npx shadcn init` apontando para `app/` em vez de `src/`. Instalar
Button, Card, Tabs, Dialog, Input, Label, Sheet. Migrar Home + Sobre como
piloto. Outros incrementais.

**Comando.** `/impeccable extract` + manual install.

---

#### P1-2. Identical card grids violam o anti-ref que o usuário escolheu
**O quê.** Quatro instâncias de "grid de N cards idênticos com ícone +
título + descrição":
- `HomeContent` Quick Access (4 cards com gradiente saturado diferente)
- `SobreContent` MVV (3 cards Missão/Visão/Valores)
- `SobreContent` Diferenciais (4 cards com cores aleatórias)
- `ProfileContent` Conta + Suporte (2 cards de configurações)

PRODUCT.md anti-ref #1 selecionada pelo usuário: **"SaaS B2B genérico —
hero-metric template, grids de cards idênticos com ícone + título +
descrição"**. O app hoje é exatamente isso, com gradient saturado em vez
de indigo.

**Por que importa.** Esses são os primeiros 3 momentos da experiência
(home, sobre, perfil). O usuário primeiro encontra o pattern que disse
"não quero ser".

**Fix por superfície.**

- **Home Quick Access**: substituir os 4 cards por um layout assimétrico:
  carteira como card largo dominante (com mini sparkline/pie do alocação),
  finanças como card secundário (saldo do mês), cursos e comunidade como
  links de eyebrow text. Rompe a uniformidade.
- **Sobre MVV**: virar prosa editorial. Missão como parágrafo big serif,
  Visão como parágrafo menor, Valores como lista nua sem caixa. Whitespace
  generoso. Tipografia carrega.
- **Sobre Diferenciais**: virar 4 linhas de texto numeradas (01..04) em
  Playfair big numerals + Inter prose. Não cards.
- **Profile Conta+Suporte**: virar lista vertical em uma só coluna, sem
  caixa. Cabeçalho de seção tipográfico.

**Comando.** `/impeccable shape home`, `/impeccable shape sobre`,
`/impeccable shape perfil` (cada um redesenha a superfície).

---

#### P1-3. Gradientes vibrantes e elementos decorativos violam a marca
**O quê.** 74 `linear-gradient`. Maioria são acertos pequenos (gold CTAs)
mas vários quebram brand:
- 4 gradientes vibrantes diferentes nos Quick Access (#1d4ed8/#3b82f6,
  #0e7490/#06b6d4, #6d28d9/#8b5cf6, #047857/#10b981)
- Sobre CTA em gradiente roxo (`#1a0f2e → #130f1a → #0f1520`) com border
  `#8b5cf6`
- Profile PrimaryBtn em gradiente roxo (`#8b5cf6 → #6d28d9`)
- Profile avatar default em gradiente roxo
- Cursos bestseller badge roxo

Decorative circles e radial-glow no Home hero (4 elementos puramente
decorativos sem informação). Glassmorphism em Navbar e cards.

**Por que importa.** Aurum não é um app roxo. Cada elemento roxo confunde
quem é o produto.

**Fix.** Substituir todos os gradientes não-ouro por sólidos da paleta de
chart aurum. Remover decorative circles. Manter glass apenas em modal
overlay (uso funcional).

**Comando.** `/impeccable quieter` (toned down) + `/impeccable colorize`.

---

#### P1-4. Hover via JS handlers em todo elemento interativo
**O quê.** 1210 instâncias de `onMouseEnter`/`onMouseLeave` mutando
`e.currentTarget.style`. Hover é JS, não CSS.

**Por que importa.**
- Quebra em touch (não há mouseenter em mobile)
- Quebra em foco (teclado)
- Quebra com `prefers-reduced-motion`
- Performance (cada mouse move re-renderiza o estado)
- Manutenção (cada elemento re-implementa hover)

**Fix.** Migrar pra CSS `:hover`, `:focus-visible`, `:active`. shadcn já
faz isso por padrão.

**Comando.** Parte de `/impeccable harden`.

---

### P2 — média prioridade

#### P2-1. Falta de sistema de tokens (5 darks, 14 sizes, 12 radii, 7 line heights)
Ver DESIGN.md §2-4. Spec proposto pronto.
**Comando.** `/impeccable extract`.

---

#### P2-2. Profile gamificado contradiz "patrimônio se constrói com paciência"
XP/levels/badges/Bronze/Prata/Ouro/Platina/conquistas/certificados/pontos
totais — toda a jornada gamificada. Princípio 3 de PRODUCT.md diz "anti-
urgência por design, calma é a feature".

**Tensão real.** O usuário escolheu "mix educacional jornada" — a jornada
implica progresso. Mas progresso não precisa de mecânica de pontos.

**Recomendação.** Manter conquistas e certificados (signals reais de
aprendizado). Tirar XP/níveis/leaderboards. Substituir "Você está a 423
XP do próximo nível" por "Próximo curso recomendado: [X], baseado no que
você completou."

**Comando.** `/impeccable distill perfil`.

---

#### P2-3. Sem skeletons, "Carregando..." em texto plano
14 instâncias de texto "Carregando...". Não há `Skeleton` component.

**Fix.** Implementar shadcn Skeleton (1 linha de instalação) e usar em todos
os data fetches.

**Comando.** `/impeccable polish` ou parte de `/impeccable harden`.

---

#### P2-4. cmdk instalado mas inerte
`cmdk` é package shadcn pra command palette. Está em `package.json` mas
não foi implementado. Investidor avançado adoraria `Cmd+K` pra busca de
ticker, navegação, ações rápidas.

**Comando.** `/impeccable craft command-palette`.

---

#### P2-5. Sem `prefers-reduced-motion`
Zero respeito a essa preferência. Conflita com a a11y "bom senso" definida
em PRODUCT.md.

**Fix.** Uma media query global em `globals.css`. 6 linhas.

**Comando.** Parte de `/impeccable harden`.

---

### P3 — baixa prioridade (housekeeping)

- **P3-1.** `<img>` em vez de `next/image` em vários lugares (logo, avatar,
  banner, news thumbnails, ticker logos). Performance de imagem.
- **P3-2.** Duas libs de toast (`react-hot-toast` + `sonner`) instaladas.
  Escolher uma e desinstalar a outra.
- **P3-3.** `src/` com app legado Vite ainda no repo. Desligar do build
  ou remover quando confirmar inutilizado.
- **P3-4.** `tailwind.config.js` E `tailwind.config.ts` coexistem.
- **P3-5.** `vite.config.js` e `next.config.ts` coexistem.

---

## 6. Persona Red Flags

### Bruno, 28, primeiro investimento — vem do Nubank

**Jornada que falha.** Bruno acabou de assinar, foi para `/dashboard`.

- ❌ Quick Access mostra 4 botões grandes coloridos. Sem dado pessoal porque
  não tem ainda. Os labels "Minha Carteira", "Minhas Finanças" assumem que
  ele sabe o que isso significa no Aurum, sem onboarding.
- ❌ Market card no canto direito mostra IBOV +0,42% — Bruno não sabe o que
  é IBOV. Sem `NivelTooltip`-style aqui.
- ❌ Vai pra Carteira: tela vazia. Empty state? `CarteiraContent` precisa
  ser inspecionado pra confirmar mas é provável que mostre apenas tabela
  vazia com "+ Adicionar Ativo". Onde Bruno aprende que tipo de ativo
  registrar?
- ❌ Vai pra Cursos: vê preços (R$ 297, R$ 197) sem entender o que dá pra
  fazer grátis primeiro. Conteúdo Gratuito está abaixo dos pagos, scroll
  necessário.
- ❌ Vai pra Perfil: 7 seções, gamification (XP/nível/badges) numa tela
  onde ele tem 0 pontos. "Bronze · Nível 1 · 0 XP" é desmotivador no
  primeiro segundo.
- ✓ NivelTooltip salvaria a experiência se fosse mais visível (ícone tem
  só 11px).

**Verdict.** Alta probabilidade de não voltar no dia 2.

### Carla, 35, intermediária

**Jornada.** Tem 12 ativos em outra plataforma, quer centralizar.

- ❌ Carteira: paleta Tailwind-500 nas charts é o primeiro red flag pra ela.
  "Parece Stripe / parece um SaaS qualquer." Conflita com a expectativa
  premium da landing.
- ❌ Importação: precisa adicionar 12 ativos manualmente. Sem CSV upload
  visível.
- ❌ Dividendos: brapi tem `cashDividends[]`, mas precisa-se confirmar que
  o app calcula DY de cashDividends (memory entry). Se ainda usa
  `dividendYield` da brapi (campo inexistente), valores estarão zerados.
- ❌ Categorias de Finanças vêm com cores Tailwind também. Cosmético, mas
  ela nota.
- ❌ Texto secundário muito faint para ela ler comentários, datas.
- ✓ Search de ações com debounce e logos: surpresa boa.
- ✓ Notícias com InfoMoney embed: agradável.

**Verdict.** Continua se ela não tiver alternativa, mas migra na primeira
chance se um app concorrente fizer charts on-brand e contraste melhor.

### Eduardo, 42, avançado

**Jornada.** Procura screener, comparação de ativos, histórico de DY.

- ❌ Não há screener. `/dashboard/acoes` é dashboard de mercado, não tela
  de filtragem.
- ❌ Não há comparador de tickers (necessário pra avaliar DY entre opções).
- ❌ Não há export. Eduardo quer baixar carteira em CSV pra IRPF.
- ❌ Não há atalhos. `Cmd+K` deveria abrir busca instantânea de ticker;
  `g h` deveria ir pra home, etc.
- ✓ AcoesContent mostra Maiores Altas/Baixas, Ibovespa com sparkline,
  câmbio, criptos. Bom dashboard de mercado.

**Verdict.** Aurum hoje é dashboard de mercado + tracking + educação. Não
tem o stack analítico que avançado quer. Por isso a frase "Mix educacional
jornada" precisa ser respeitada — Eduardo é o destino, mas hoje o produto
não atende ele.

---

## 7. Minor Observations

- `app/dashboard/HomeContent.tsx:34` — texto "Brasileiros entre 25-40" vira
  alvo de redesign em DESIGN.md, mas a linha mais forte da Sobre ("Fundado
  em valor. Construído para durar.") merece aparecer em Home, não escondida
  em Sobre.
- `globals.css:23` define `body { background-color: #0a0a0a }` mas todas
  as páginas dashboard sobrescrevem com `#0a0806`. Resultado: rotas auth
  (`/login`, `/register`) provavelmente herdam o cold black off-brand.
- `aurum-zebra-row` no `globals.css` é um vestígio do refactor — usado uma
  única vez? Investigar.
- `_vars` legacy: `tailwind.config.js` e `tailwind.config.ts` coexistem.
  Postcss carrega o `.js`. Sincronizar ou deletar um.
- `proxy.ts` no root do projeto sem contexto óbvio de uso. Documentar ou
  remover.
- `base44/` directory sem README — vestígio da plataforma low-code original.
- O nome do projeto no `package.json` é `aurum-insights` mas o brand é
  "Aurum Investimentos" e o domínio é `aurum-app-kappa.vercel.app`. Três
  nomes pra uma coisa.

---

## 8. Questions to Consider

Provocações que podem destravar saltos maiores:

- **E se não houvesse a página Sobre dentro do dashboard?** Tirar /sobre
  do dashboard e movê-la pra rota pública (marketing). O usuário logado
  não precisa ler "Junte-se a milhares de investidores" — ele já se juntou.
  E a /sobre pública pode rodar register=brand com liberdade total.

- **E se o "ouro" fosse uma decisão semanal, não diária?** Deixar a maior
  parte da UI em warm-neutrals e usar o ouro só em momentos: ganho da
  semana, conquista, atingiu meta. O ouro vira evento, não decoração.

- **E se Cursos não fosse separado?** Hoje é uma tab no nav. Mas o
  Princípio 5 ("Mostra o trabalho. Educação e dados moram juntos.") sugere
  que cada tela densa tenha um sidebar ou drawer com a explicação contextual,
  e Cursos seja só agregador. Equivale a fundir Educação dentro do produto
  em vez de tab separada.

- **E se o Perfil fosse 2 telas?** Hoje tem 7 seções numa página, todas
  abertas. Talvez "Conta" seja `/dashboard/conta` (settings, bio, avatar,
  assinatura) e "Perfil público" seja `/perfil/{slug}` (atividade,
  conquistas pra outros verem). Separar concerns.

- **E se aceitasse luz?** Direção B em DESIGN.md. Cream warm com gold accent.
  É radical para fintech mas é o caminho mais fora do reflexo IA. Vale uma
  prototipagem rápida em uma página antes de descartar.

---

## 9. Recommended Actions (em ordem de impacto/custo)

Cada item em sequência. O usuário pode pedir um por vez ou em lote.

| # | Comando | Foco | Custo | Impacto |
|---|---|---|---|---|
| 1 | `/impeccable colorize` | Tokens em `:root`, escala de muted text que passa AA, paleta de chart Aurum 8-hue | Baixo (1 arquivo + replace_all) | **Alto** — corrige P0-1 e P0-3 ao mesmo tempo |
| 2 | `/impeccable polish` | Remove 4 side-stripes + 2 gradient texts. Substitui por sólidos / weight contrast | Baixo (6 edits cirúrgicos) | **Alto** — fecha bans P0-2 |
| 3 | `/impeccable extract` | Instala shadcn em `components/ui/`, extrai Button, Card, Input, Tabs, Dialog, Skeleton, EmptyState | Médio (instalação + 8 wrappers) | **Muito alto** — desbloqueia tudo depois |
| 4 | `/impeccable shape home` | Redesenho do Home Quick Access em layout assimétrico, sem grid de 4 cards iguais | Médio | Alto — primeira impressão |
| 5 | `/impeccable shape sobre` | Sobre vira editorial: prosa Playfair, sem cards coloridos roxos | Médio | Alto — anti-brand inversion |
| 6 | `/impeccable harden` | CSS `:hover`/`:focus-visible` em vez de 1210 onMouseEnter; `prefers-reduced-motion`; skeletons; mensagens de erro UI | Alto | **Muito alto** — qualidade global |
| 7 | `/impeccable distill perfil` | Reduz Profile gamificado: tira XP/níveis/leaderboards, mantém conquistas/certificados; separa em /conta + /perfil/{slug} | Médio | Médio-alto |
| 8 | `/impeccable adapt` | Audit de breakpoints; muitas pages têm `gridTemplateColumns: "1fr 300px"` ou `repeat(4, 1fr)` que quebram <768px | Médio | Médio-alto |
| 9 | `/impeccable craft command-palette` | Implementar `cmdk` que já está instalado; busca instantânea de ticker, navegação, ações | Médio | Médio (ganha avançado) |
| 10 | `/impeccable clarify` | Empty states e mensagens de erro no tom mentor+sócio descrito em PRODUCT.md | Baixo | Médio |
| 11 | `/impeccable polish` final | Limpeza: dois toasts, dois tailwind config, /src legacy, etc. | Baixo | Baixo (housekeeping) |

**Caminho recomendado de uma sprint (2 semanas).** 1 → 2 → 3 → 4 + 5 em
paralelo após 3 estar pronto. Isso resolve P0 inteiro e P1 majoritário.
Pula de **19/40 → ~28/40** sem reestruturar arquitetura.

**Caminho de trimestre.** Toda a tabela. Chega em **~32/40**.

**Caminho de v2 (não nesta crítica).** Direção B (editorial-light) ou
Direção C (terminal-native) só faz sentido depois do passo 3 — sem
sistema de componentes, mudar estética é refazer 24 arquivos por mão.
