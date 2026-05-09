"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Conteúdo ──────────────────────────────────────────────────────────────
//
// O texto é o ativo de marca mais forte do app. Mantemos verbatim e deixamos
// a tipografia carregar a hierarquia, sem cards, ícones coloridos ou MVV
// boilerplate. A lista de "Diferenciais" vira lista numerada de princípios.

const PRINCIPIOS = [
  {
    label: "Educação que cria autonomia",
    body: "Cursos estruturados do básico ao avançado. O objetivo não é te prender ao app: é te dar o vocabulário para tomar decisões sozinho, com método.",
  },
  {
    label: "Análises que sobreviveriam à prova de bolso",
    body: "Dados em tempo real, indicadores fundamentais, agenda de dividendos. Tudo pensado para um investidor pessoa-física que paga as próprias contas, não para uma mesa de operações.",
  },
  {
    label: "Comunidade séria, sem hype",
    body: "Um espaço para investidores trocarem teses, não receitas mágicas. Moderação real, conteúdo educacional como prioridade, ausência deliberada de gamificação infantilizada.",
  },
  {
    label: "Tecnologia que some quando funciona",
    body: "Carteira, finanças pessoais, screener, dividendos: integrados num só lugar, com a interface saindo da frente quando você precisa só dos números.",
  },
];

export default function SobreContent() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-58px)] bg-background">
      <article className="mx-auto max-w-[720px] px-6 pt-8 pb-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-12 -ml-3 text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-[15px]" /> Voltar
        </Button>

        {/* Hero */}
        <header className="text-center mb-20">
          <Eyebrow>Sobre o Aurum</Eyebrow>
          <h1 className="mt-6 font-display font-bold text-[clamp(40px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-[var(--text-strong)]">
            Patrimônio se constrói<br />
            <span className="text-primary">com paciência</span>
          </h1>
          <p className="mt-7 text-[15px] leading-[1.65] text-muted-foreground max-w-[440px] mx-auto">
            Uma plataforma brasileira de educação financeira para quem prefere
            método a promessas, e tempo a atalhos.
          </p>
        </header>

        {/* Manifesto */}
        <Section>
          <SectionEyebrow>Manifesto</SectionEyebrow>
          <SectionTitle>O que nos move</SectionTitle>
          <Prose>
            <p className="aurum-dropcap">
              O Grupo Aurum nasceu da crença de que dinheiro é uma ferramenta,
              não um destino. Somos uma empresa brasileira de educação
              financeira focada em construção de patrimônio real, com ênfase em
              investimentos em dividendos, mentalidade de longo prazo e
              disciplina financeira.
            </p>
            <p>
              Aqui você não encontra promessas de enriquecimento rápido.
              Encontra método, profundidade e uma comunidade que pensa
              diferente sobre o futuro.
            </p>
            <p>
              Valor não se cria da noite para o dia. Se cria com consistência,
              conhecimento e as escolhas certas ao longo do tempo.
            </p>
          </Prose>

          <Aphorism>
            Fundado em valor.<br />Construído para durar.
          </Aphorism>
        </Section>

        {/* Princípios */}
        <Section className="mt-24">
          <SectionEyebrow>Princípios</SectionEyebrow>
          <SectionTitle>Como pensamos sobre o produto</SectionTitle>
          <ol className="mt-12 space-y-12">
            {PRINCIPIOS.map(({ label, body }, i) => (
              <li
                key={label}
                className="grid grid-cols-[64px_1fr] gap-x-6 gap-y-2 sm:grid-cols-[80px_1fr] sm:gap-x-8"
              >
                <span
                  aria-hidden
                  className="font-display text-[44px] sm:text-[56px] leading-none text-[var(--gold-dim)] tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-sans font-semibold text-[17px] sm:text-[18px] text-[var(--text-default)] mb-2 leading-snug">
                    {label}
                  </h3>
                  <p className="text-[14px] sm:text-[15px] leading-[1.7] text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Closing CTA */}
        <Section className="mt-24 pt-16 border-t border-[var(--border-faint)]">
          <div className="text-center">
            <h2 className="font-display font-bold text-[clamp(26px,3vw,32px)] leading-tight tracking-[-0.01em] text-[var(--text-strong)]">
              Comece hoje. Reveja em dez anos.
            </h2>
            <p className="mt-5 text-[14px] sm:text-[15px] leading-[1.7] text-muted-foreground max-w-[420px] mx-auto">
              Você não precisa começar com muito. Precisa começar com método,
              e voltar consistentemente.
            </p>
            <div className="mt-9">
              <Button
                variant="gold"
                size="xl"
                onClick={() => router.push("/dashboard")}
              >
                Voltar ao painel
              </Button>
            </div>
          </div>
        </Section>
      </article>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={className}>{children}</section>;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-8 bg-[var(--gold-dim)]" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-primary font-medium">
        {children}
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] uppercase tracking-[0.22em] text-primary font-medium">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-tight tracking-[-0.01em] text-[var(--text-strong)]">
      {children}
    </h2>
  );
}

// Editorial prose block. Drop cap on .aurum-dropcap paragraph (rule lives in
// globals.css), generous line-height, capped line length via article max-width.
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 space-y-5 text-[15px] sm:text-[16px] leading-[1.8] text-[var(--text-body)]">
      {children}
    </div>
  );
}

// Centered display aphorism. Thin gold rules above and below, Playfair italic,
// gold. The page's only Committed-color moment.
function Aphorism({ children }: { children: React.ReactNode }) {
  return (
    <figure className="my-16 text-center">
      <hr className="mx-auto w-12 h-px border-0 bg-[var(--gold-dim)]" />
      <blockquote className="my-7 font-display italic text-[24px] sm:text-[28px] leading-[1.3] text-primary tracking-[0.01em]">
        {children}
      </blockquote>
      <hr className="mx-auto w-12 h-px border-0 bg-[var(--gold-dim)]" />
    </figure>
  );
}
