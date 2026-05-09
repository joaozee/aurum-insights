# Design System — Aurum

Captured from the codebase as it stands today, with honest notes on what's
working, what's broken, and three concrete aesthetic directions to choose from.

---

## 1. Theme

**Strategy: dark-first, committed warm dark.**

Scene sentence (the test from impeccable's shared laws):
*"Brazilian retail investor, 9pm, reviewing portfolio on the couch with one
hand on a phone or laptop, ambient room light low to medium, mind half-tired,
half-curious."*

Dark is the right answer for that scene: low glare, conducive to long reading
of dense numerical content, and allows accent color to carry weight. The
warm dark (vs cool dark) is the deliberate move that separates Aurum from
the bluish-black SaaS dashboards and the cold black trading-bro UIs.

**Current implementation:** correct direction, executed inconsistently.
At least 5 different darks coexist in code:

| Hex | Where used | Note |
|---|---|---|
| `#0a0a0a` | `globals.css` body | Cold black, off-brand |
| `#0a0806` | dashboard pages background | Warm dark, on-brand |
| `#0d0b07` | dashboard layout shell, inputs | Warm dark, on-brand |
| `#130f09` | card surfaces | Warm dark elevated, on-brand |
| `#1a1410`, `#1a1508` | hover/secondary | Warm dark hover, on-brand |

The cold black in `globals.css` leaks through whenever a route doesn't override.

---

## 2. Color

**Strategy: committed, with restrained moments.** Gold carries identity at
the top of hierarchy (logo, primary CTA, conquests, brand accent). Warm
neutrals (gold-tinted off-blacks and greys) carry the dense reading layer.
Semantic colors (green/red) carry status only. **Everything else should be
re-tinted toward the gold hue.**

### 2.1 Current palette (observed in code, untokenized)

#### Brand gold
- `#E8C96A` — light gold (highlights)
- `#C9A84C` — primary gold (CTA, brand)
- `#A07820` — dark gold (gradients end)
- `#9B7A29`, `#8B6914`, `#8a6a20` — gold tail (avatar gradients, deeper)

#### Warm neutrals (gold-tinted darks → highlights)
- `#0a0806` page bg (deepest)
- `#0d0b07` shell bg
- `#130f09` card bg
- `#1a1410` hover bg
- `#2a2010` border on inputs
- `#4a3a1a` faint text (~1.7:1 contrast — invisible)
- `#5a4a2a` very muted text (~2.4:1 — fails AA)
- `#6a5a3a` muted text (~3.0:1 — fails AA body)
- `#7a6a4a` secondary text (~3.7:1 — fails AA body)
- `#857560`, `#8a7a5a` body text variants (~4.5:1, borderline)
- `#9a8a6a` strong secondary (~5.3:1 — passes AA)
- `#a09068` brand-friendly muted (~5.7:1 — passes AA)
- `#c8b89a` body emphasis (~7.8:1)
- `#e8dcc0` headings (~10.5:1)
- `#f0e8d0` high-emphasis headings (~12:1)

Half of this scale **fails WCAG AA for body text** on the standard `#0a0806`
background. The four faintest tones (`#4a3a1a` to `#7a6a4a`) appear in dozens
of places for things users actually need to read: prices, secondary labels,
empty-state hints, chart axis labels. **This is the single highest-impact
fix in the audit.**

#### Status colors (semantic)
- `#10b981`, `#22c55e`, `#34d399` — three different greens for "positive/income"
- `#ef4444`, `#f87171`, `#dc2626` — three different reds for "negative/loss"
- They should collapse to one of each, with a defined hover variant.

#### Anti-pattern: the Tailwind-500 invasion
Found in `CarteiraContent.tsx` and `FinancasContent.tsx` as the primary
data-viz palette:

```ts
// CarteiraContent: PALETTE used for ticker colors
["#8b5cf6","#3b82f6","#0ea5e9","#06b6d4","#14b8a6",
 "#22c55e","#eab308","#f97316","#ef4444","#ec4899"]

// FinancasContent: CATEGORY_COLORS
{ Alimentação: "#f59e0b", Transporte: "#3b82f6",
  Moradia: "#8b5cf6", Saúde: "#ec4899", Educação: "#06b6d4", ... }
```

This is the literal Tailwind 400-500 palette. Inside an editorial gold-and-dark
identity, suddenly every donut chart, transaction list, and category indicator
explodes into bright Stripe-style purple/cyan/pink. The brand snaps the moment
data viz appears. **This needs to go,** replaced with a chart palette built
from the Aurum hue family (warm golds, terracottas, ambers, deep teals,
oxidized greens, charred reds — colors that share a family resemblance).

Also leaks into:
- Sobre `MVV` cards (yellow + cyan + green colored borders)
- Sobre `DIFERENCIAIS` (purple + orange + green + cyan icons)
- Sobre CTA `linear-gradient(135deg, #1a0f2e 0%, #130f1a 50%, #0f1520 100%)`
  with `#8b5cf6` border — a purple gradient on the about-us page is a brand
  inversion
- HomeContent `QUICK_ACCESS` (4 different vibrant gradients: blue, cyan,
  purple, green)
- ProfileContent default avatar `linear-gradient(#8b5cf6, #6d28d9)` — purple
- ProfileContent `PrimaryBtn` purple gradient
- Cursos `bestseller` badge (purple gradient)

### 2.2 Recommended tokens (semantic, OKLCH)

Define once in `globals.css` and migrate. Approximate hex shown in parens.

```css
:root {
  /* Surface */
  --bg-page:      oklch(0.155 0.012 75);   /* #0a0806 */
  --bg-shell:     oklch(0.175 0.012 75);   /* #0d0b07 */
  --bg-card:      oklch(0.205 0.014 72);   /* #130f09 */
  --bg-card-hover:oklch(0.235 0.016 72);   /* #1a1410 */

  /* Borders */
  --border-faint: oklch(0.205 0.014 72 / 0.3);
  --border-soft:  color-mix(in oklch, var(--gold) 12%, transparent);
  --border-emphasis: color-mix(in oklch, var(--gold) 28%, transparent);

  /* Text — every step ≥4.5:1 on bg-page */
  --text-strong:  oklch(0.92 0.020 85);    /* #f0e8d0 */
  --text-default: oklch(0.86 0.025 82);    /* #e8dcc0 */
  --text-body:    oklch(0.78 0.030 80);    /* #c8b89a */
  --text-muted:   oklch(0.66 0.035 78);    /* a09068 — currently the only AA-safe muted */
  --text-faint:   oklch(0.58 0.035 78);    /* drop anything fainter */

  /* Brand */
  --gold:         oklch(0.74 0.13 80);     /* #C9A84C */
  --gold-light:   oklch(0.83 0.15 82);     /* #E8C96A */
  --gold-dim:     oklch(0.55 0.10 78);     /* #9B7A29 */

  /* Status — single hue per role */
  --positive:     oklch(0.72 0.17 155);    /* warmer green than #10b981 */
  --negative:     oklch(0.65 0.20 25);     /* terracotta-leaning red, not #ef4444 */
  --neutral:      var(--text-muted);

  /* Data-viz palette: 8 colors, all in same lightness band, hue-spaced */
  --chart-1: oklch(0.74 0.13 80);   /* gold (anchor) */
  --chart-2: oklch(0.66 0.15 50);   /* amber */
  --chart-3: oklch(0.62 0.16 25);   /* terracotta */
  --chart-4: oklch(0.58 0.10 350);  /* dusky rose */
  --chart-5: oklch(0.60 0.10 280);  /* mauve */
  --chart-6: oklch(0.58 0.08 220);  /* slate blue */
  --chart-7: oklch(0.65 0.10 180);  /* desaturated teal */
  --chart-8: oklch(0.68 0.13 130);  /* olive green */
}
```

Every color through one source of truth. Then `bg-page`, `text-body`, etc.
become utility classes via Tailwind theme extension.

### 2.3 Color strategy on the four-step axis

Per impeccable's color strategy taxonomy:

- **Restrained** for utility surfaces (Finanças tables, settings, forms,
  Carteira lists): tinted neutrals + gold accent ≤10%.
- **Committed** for brand surfaces (Sobre, Cursos hero, empty states,
  conquest moments): gold carries 30-40% of the surface deliberately.
- **Full palette** for data viz only: the 8-color chart palette above, used
  in charts and never anywhere else.
- **Drenched**: nowhere by default. Maybe a "premium upgrade" page later.

The current app behaves more like "drenched in gold accents everywhere"
without commitment, which reads as decorative gilt.

---

## 3. Typography

### 3.1 Fonts (current, keep)

- Display: **Playfair Display** (400-700) via `next/font/google`
- Body: **Inter** (variable) via `next/font/google`
- Both wired up in `app/layout.tsx`, exposed via `--font-display` / `--font-sans`

This pairing is solid and on-brand. **Keep.**

But: every component sets `fontFamily: "var(--font-sans)"` inline literally
hundreds of times. That's overhead with zero benefit since `body` already
sets the default font. The only inline `fontFamily` that should exist is
`var(--font-display)` for headings; everything else should inherit.

### 3.2 Type scale (current, scattered)

Sampled sizes in use: 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 32,
clamp(36, 4vw, 52). Fourteen distinct sizes, no system. Half are within
1px of each other.

### 3.3 Recommended scale (6 steps + display)

```
xs    11px   labels, captions, micro-meta
sm    13px   body small, secondary
base  14px   body default
lg    16px   emphasis body, card titles
xl    20px   section headings
2xl   28px   page headings
3xl   clamp(36px, 4vw, 52px)   hero/display
```

Display sizes use Playfair (`var(--font-display)`). Everything ≤ `xl` uses
Inter. No `9px` or `10px` sizes for anything users need to read; reserve
that range for legal/footer micro-copy only.

### 3.4 Weights and tracking

- Inter: 400 default, 500 emphasis, 600 strong, 700 numerals
- Playfair: 600 for headings (700 only at hero scale)
- Letter-spacing: heading -0.01em, eyebrow labels +0.06em uppercase, body 0

Currently 6+ different `letterSpacing` values are in play (`-0.01em`,
`0.01em`, `0.04em`, `0.06em`, `0.08em`, `0.1em`, `0.12em`). Consolidate.

### 3.5 Line heights

Currently 15+ different line heights. Reduce to four:

```
tight    1.15   display headings
snug     1.3    section headings, card titles
normal   1.5    body, paragraphs
relaxed  1.65   long-form essays (Sobre)
```

---

## 4. Spacing & Layout

### 4.1 Container widths (current, inconsistent)

`maxWidth` values found: `860px` (Sobre), `1100px` (Perfil), `1200px`
(Cursos), `1280px` (Home, Ações). No system.

Recommended:

```
prose      640px   /* long-form Sobre, terms */
narrow     900px   /* Profile self-view, settings */
default   1200px   /* most dashboard pages */
wide      1440px   /* future: power-user data tables */
```

### 4.2 Spacing scale (current, ad-hoc)

Padding values found in samples: `2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 56, 64`.
Twenty-nine different spacing values. There's no rhythm.

Recommended 8pt scale:

```
0   0
1   4
2   8
3   12
4   16
5   24
6   32
7   48
8   64
9   96
```

Use sparingly. **Vary spacing for rhythm** (impeccable shared law) — same
padding everywhere = monotony, but right now the issue is the opposite:
near-arbitrary variation that reads as accidental.

### 4.3 Border radius

Found: `4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 20, 50%`. Twelve values.

Recommended:

```
sm    6px    inputs, small chips
md    10px   buttons, cards
lg    14px   feature cards, modals
full  9999px pills, avatars
```

---

## 5. Components — current state

### 5.1 What exists (and how)

- **Navbar** (1 file, 313 lines, all inline styles): glass blur, gold
  active-pill, avatar dropdown, notifications bell.
- **Cards**: dozens of unique inline-styled card definitions. No shared
  component. Same shape (`#130f09` bg + `rgba(201,168,76,0.1)` border +
  12px radius + 16-22px padding) repeated by hand at least 30 times.
- **Buttons**: at least 6 distinct button styles (gold gradient pill,
  ghost, social, header, settings row, primary purple). No shared
  component, no variant API.
- **Inputs**: defined inline as `inputStyle` constants in Carteira and
  Finanças, copy-pasted. No shared component.
- **Modals**: each page implements its own modal shell with overlay,
  blur, ESC handling. At least 4 implementations.
- **Empty states**: each section invents its own. Some use flat text, some
  card with link, some role="link" tabIndex 0 div.
- **Toasts**: `react-hot-toast` and `sonner` both installed; not clear
  which is canonical.

### 5.2 The shadcn paradox

`components.json` declares shadcn (style: new-york, baseColor: neutral, alias
`@/components/ui`) but **there is no `components/ui/` directory** in the
new App Router layout. Tailwind config exists but is barely consumed
(`className=` total: 65, vs `style={{` total: 1492).

The legacy Vite app in `src/` likely had it, but the migration to Next App
Router didn't carry it over. This is the single biggest leverage point in
the codebase: install shadcn into the new structure, port the inline styles
to component variants, and the codebase shrinks ~40-60% with consistency
appearing for free.

### 5.3 Recommended component layer

Minimum to extract (in order of leverage):

1. **`Button`** — variants: primary (gold), secondary, ghost, danger.
2. **`Card`** — single shape, optional `padded`, `interactive`, `hero` props.
3. **`Input`, `Label`, `FormField`** — replace the inline `inputStyle` const.
4. **`Tabs`** — used in Profile (3 places), Cursos filter chips. Currently
   each one re-implements active state.
5. **`Badge` / `Chip`** — for category, level, premium, "novo".
6. **`Modal` / `Sheet`** — replace 4 ad-hoc modal implementations.
7. **`EmptyState`** — text + optional icon + optional CTA.
8. **`StatCell`** — used in Profile and Carteira summary rows.
9. **`Skeleton`** — currently no loading skeletons; "Carregando..." text instead.
10. **`Avatar`** — has gradient fallback; centralize.

shadcn provides 1, 3, 4, 6 directly. The rest are 30-line wrappers.

---

## 6. Motion

### 6.1 Current state

- 1210 inline `onMouseEnter`/`onMouseLeave` handlers mutating
  `e.currentTarget.style`. Hover is implemented in JS, not CSS.
- Two keyframes defined in Tailwind config (`fade-in`, `accordion-up/down`)
  but rarely used.
- Framer Motion installed (`framer-motion ^11.16.4`) but not used in any
  read-component.
- No `prefers-reduced-motion` handling anywhere.
- Several `transition: "all 0.15s"` strings which is the lazy default.

### 6.2 Recommended motion system

**Use CSS `:hover` for hover states, not JS handlers.** Once components
exist, this is one rewrite.

```css
@layer base {
  * { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

Durations:

```
instant   100ms   color/border on hover
fast      150ms   small elements
normal    200ms   buttons, cards
slow      300ms   modals, page transitions
```

Easing: `ease-out` exponential family (cubic-bezier(0.16, 1, 0.3, 1) for
"expo out"). No bouncing, no elastic — the impeccable shared law that
applies cleanly here.

Reach for Framer Motion only for layout transitions in the community feed
and modal mounts. Everything else is CSS.

---

## 7. Iconography

`lucide-react` is the icon library. ~75 unique icons used across the app.
Sizes are scattered (9, 10, 11, 12, 13, 14, 15, 16, 18, 20px). Recommended:

```
xs   12   inline with caption text
sm   14   in buttons, list rows (default)
md   16   section headings, card eyebrows
lg   20   feature cards, hero
```

Stroke weight: stick with default 1.5. No 2px+ for the warm-dark register;
heavy strokes feel cheap.

---

## 8. Three direction options for the next visual lap

PRODUCT.md flagged the current "finance + dark + gold" as the predictable
category reflex. Three concrete alternatives, each respecting "premium"
without falling into private-banking cliché:

### Direction A — "Sharpen the gold"
Keep the gold-and-dark family but treat it like a museum, not a vault.

- Tinted neutrals (above), AA-clean
- Gold reserved for: logo, primary CTA, conquest moments, eyebrow accents.
  Removed from: 4 quick-access cards (de-color those entirely or use
  category-tinted neutrals), category borders, every hover effect.
- Charts in the warm 8-hue family (chart palette above).
- Side-stripes removed everywhere.
- Gradient text removed (Home greeting, Profile tier).
- Cards become bg-card + border-faint with no gradient, no decorative
  circles, no radial-glow halos.

This is the lowest-risk path. ~2 weeks of polish work and the codebase
looks like a $200/mo product instead of a $19/mo SaaS in costume.

### Direction B — "Editorial-typographic"
Lean fully into Playfair and turn the dashboard into a magazine.

- Gold dropped to a single accent stroke (rule lines, not surfaces).
- Background lifts to a warm cream `oklch(0.97 0.018 88)` — light mode by
  default. Dark mode optional.
- Numbers and tables in tabular-figure Inter. Headings in Playfair.
- Module spacing ~3x current. Whitespace as the luxury signal.
- Ações news section becomes the editorial template applied everywhere.

This kills the "finance + dark + gold" reflex completely. Risks: requires
re-building chart aesthetics for light mode, and some users associate
"investing serious" with dark UIs (this is solvable with a system theme
toggle that defaults light).

### Direction C — "Terminal-native, with warmth"
Lean into the data side. Monospace for numbers, dense layouts, almost
Bloomberg-ish, but with one soft brand element to keep it human.

- IBM Plex Mono for all numerals.
- Inter for prose, Playfair only for the brand mark (no editorial display).
- Background: dark warm-charcoal `oklch(0.18 0.008 60)`, slightly warmer
  than current.
- Gold replaced by a single warm-amber `oklch(0.74 0.18 70)` accent used
  with extreme restraint (cursor highlights, current-row indicators only).
- Tables become first-class citizens with fixed column widths and aligned
  numerals.
- Charts SVG-native, single hue (the amber), no Tailwind palette anywhere.

Highest-risk but most differentiated. Reads like a tool, not a brand —
which the user explicitly opted in to (anti-ref: SaaS B2B genérico).
Iniciantes might bounce on first load; the educational layer (Principle 1
in PRODUCT.md) becomes critical here.

### Recommendation

Default: **Direction A** for v1.5 (one quarter of polish). It pays off
the obvious craft debt, fixes the contrast crisis, removes all 4 ban
violations, and ships a coherent gold-and-dark experience without throwing
the brand away. Plan **Direction B or C** for v2.0 once the design system
exists as an actual layer (not 1492 inline styles), so a re-skin becomes
a token swap rather than a 24-file rewrite.

---

## 9. What to fix first (top 5, ordered)

1. **Define `:root` color tokens and migrate `globals.css`**, get rid of
   `#0a0a0a` cold-black leak, force the warm dark everywhere.
2. **Drop the four faintest text tones** (`#4a3a1a`, `#5a4a2a`, `#6a5a3a`,
   `#7a6a4a`) and rebuild the muted-text scale with AA-passing values.
   This single change cleans up dozens of reading complaints users won't
   verbalize but will feel.
3. **Remove all 4 side-stripe borders** (Carteira × 2, Finanças × 1,
   Mensagens × 1) and the 2 gradient-text instances (Home greeting, Profile
   tier). Replace with full borders, leading numerals, or weight contrast.
4. **Replace the Tailwind-500 chart palette** in Carteira and Finanças
   with the 8-hue Aurum chart family.
5. **Install shadcn into `components/ui/`**, extract `Button`, `Card`,
   `Input`, `Tabs`, `Modal`, `EmptyState`. Migrate Home + Sobre as the
   pilot. Other pages follow incrementally.
