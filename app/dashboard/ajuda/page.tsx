import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ajuda | Aurum Investimentos",
};

const FAQ_GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Começando",
    items: [
      {
        q: "Por onde começo se nunca investi?",
        a: "Vá em Cursos e abra a trilha 'Investimento do Zero'. São oito aulas curtas que cobrem renda fixa, ações e FIIs, com vocabulário em português, sem jargão. Em paralelo, registre o que você já tem (mesmo que pouco) na Carteira — isso ancora o resto.",
      },
      {
        q: "O Aurum é para iniciante ou para quem já investe?",
        a: "Para os dois. A interface mostra o básico em primeiro plano e revela ferramentas avançadas (screener, P/L, comparadores) à medida que você as procura. Densidade que cresce com o usuário.",
      },
      {
        q: "Preciso conectar conta bancária?",
        a: "Não. O Aurum não puxa extratos automaticamente — você adiciona ativos e transações manualmente. Importação de extrato B3 e PDF está no roteiro, mas opt-in.",
      },
    ],
  },
  {
    title: "Carteira & Dividendos",
    items: [
      {
        q: "De onde vêm os preços e o DY?",
        a: "Cotações em tempo real e histórico de dividendos vêm da brapi (B3 oficial). O Dividend Yield é calculado dividindo a soma dos cashDividends dos últimos 12 meses pelo preço atual do ativo — não usamos o campo 'dividendYield' da brapi porque ele é instável.",
      },
      {
        q: "Posso adicionar ações dos EUA?",
        a: "Por enquanto só ativos da B3 (ações, FIIs, BDRs com ticker B3). Suporte a NYSE/Nasdaq está no roteiro.",
      },
      {
        q: "Como funciona o cálculo de payback em dividendos?",
        a: "Pegamos o total investido na carteira e dividimos pela renda anual estimada em dividendos (DY × valor de mercado). É uma projeção — assume que o DY se mantém constante, o que raramente é verdade. Use como ordem de grandeza, não como número de planejamento.",
      },
    ],
  },
  {
    title: "Finanças",
    items: [
      {
        q: "Pessoal e Empresa são separados?",
        a: "Sim. O toggle Pessoal/Empresa no topo da tela troca o conjunto inteiro de transações, orçamentos e categorias. Você pode usar só um dos dois, ou ambos — não há custo extra.",
      },
      {
        q: "Tem importação de extrato bancário?",
        a: "Em breve. Por enquanto, lançamento manual ou importação por planilha CSV (em roteiro).",
      },
    ],
  },
  {
    title: "Conta",
    items: [
      {
        q: "Como mudo minha senha?",
        a: "Por enquanto, faça logout e use o link 'Esqueci minha senha' na tela de login. Suporte a alteração inline está no roteiro.",
      },
      {
        q: "Como apago minha conta?",
        a: "Mande um e-mail para suporte@grupoaurum.com.br pedindo a exclusão. Em até 5 dias úteis, removemos seus dados (carteira, finanças, posts, comentários, perfil) de forma irreversível, conforme LGPD.",
      },
    ],
  },
];

export default async function AjudaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-[calc(100vh-58px)] bg-background">
      <div className="mx-auto max-w-[720px] px-6 pt-8 pb-20">
        <Button asChild variant="ghost" size="sm" className="mb-10 -ml-3 text-muted-foreground hover:text-primary">
          <Link href="/dashboard/configuracoes">
            <ChevronLeft className="size-[15px]" /> Voltar
          </Link>
        </Button>

        <header className="mb-12">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
            Ajuda
          </span>
          <h1 className="mt-3 font-display font-bold tracking-[-0.01em] text-[clamp(28px,3.5vw,38px)] leading-tight text-[var(--text-strong)]">
            Como podemos ajudar?
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-body)] max-w-[560px]">
            As perguntas que mais aparecem, com respostas curtas. Se a sua não
            está aqui, tem um link de contato no fim da página.
          </p>
        </header>

        <div className="space-y-12">
          {FAQ_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-default)] mb-4">
                {group.title}
              </h2>
              <ul className="border-t border-[var(--border-faint)]">
                {group.items.map((item) => (
                  <li key={item.q} className="border-b border-[var(--border-faint)] py-5">
                    <p className="text-[14px] font-semibold text-[var(--text-default)] mb-2 leading-snug">
                      {item.q}
                    </p>
                    <p className="text-[13px] leading-relaxed text-[var(--text-body)]">
                      {item.a}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-xl border border-[var(--border-soft)] bg-card p-6">
          <div className="flex items-start gap-4">
            <Mail size={18} className="text-[var(--gold)] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-display text-[15px] font-semibold text-[var(--text-default)] mb-1">
                Não achou o que procurava?
              </p>
              <p className="text-[13px] text-[var(--text-body)] leading-relaxed mb-4">
                Mande sua dúvida diretamente. Respondemos em até 1 dia útil.
              </p>
              <Button asChild variant="outline" size="sm" className="text-[12px]">
                <Link href="/dashboard/contato">Falar com suporte</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
