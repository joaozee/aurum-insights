import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Assinatura | Aurum Investimentos",
};

const PREMIUM_FEATURES = [
  "Carteira ilimitada — ações, FIIs, renda fixa, cripto, sem limite de posições",
  "Otimização de carteira por IA com perfil de risco personalizado",
  "Agenda de dividendos completa com histórico e projeções de 12 meses",
  "Finanças pessoais e empresariais lado a lado, com orçamentos e metas",
  "Cursos completos com certificado e mentor sênior",
  "Comunidade premium com posts e grupos exclusivos",
  "Suporte prioritário por e-mail",
];

export default async function AssinaturasPage() {
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
            Assinatura
          </span>
          <h1 className="mt-3 font-display font-bold tracking-[-0.01em] text-[clamp(28px,3.5vw,38px)] leading-tight text-[var(--text-strong)]">
            Aurum Premium
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-body)] max-w-[560px]">
            Você está no plano gratuito. O Premium destrava a plataforma inteira —
            tudo que faz parte da promessa de "um único app substitui quatro".
          </p>
        </header>

        {/* Plan card */}
        <section className="rounded-xl border border-[var(--border-soft)] bg-card p-7">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-[var(--gold)]" />
                <h2 className="font-display text-[20px] font-semibold text-[var(--text-default)]">
                  Premium Anual
                </h2>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Todas as funcionalidades, sem limite, por 12 meses.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-faint)] mb-1">
                A partir de
              </p>
              <p className="font-display text-[28px] font-bold text-[var(--gold)] leading-none">
                R$ 19<span className="text-[14px] font-medium text-[var(--text-muted)]">/mês</span>
              </p>
              <p className="text-[10px] text-[var(--text-faint)] mt-1">
                cobrado anualmente
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 mb-7">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[var(--text-body)] leading-relaxed">
                <Check size={14} className="text-[var(--gold)] mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button variant="gold" size="lg" disabled className="w-full text-sm tracking-[0.04em] cursor-not-allowed opacity-70">
            Em breve — checkout via Stripe
          </Button>
          <p className="mt-3 text-center text-[11px] text-[var(--text-faint)]">
            Cancele quando quiser. 7 dias de garantia incondicional.
          </p>
        </section>

        <section className="mt-10">
          <h3 className="font-display text-[16px] font-semibold text-[var(--text-default)] mb-3">
            Por que cobramos?
          </h3>
          <p className="text-[13px] leading-relaxed text-[var(--text-body)] max-w-[600px]">
            Aurum não vende seus dados nem mostra anúncios. A receita vem de
            quem assina — e por isso construímos a plataforma para o investidor,
            não para o investidor virar produto. Se for útil para você, é
            sustentável para a gente.
          </p>
        </section>
      </div>
    </div>
  );
}
