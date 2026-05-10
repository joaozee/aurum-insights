import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Termos de Uso | Aurum Investimentos",
};

export default async function TermosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-[calc(100vh-58px)] bg-background">
      <div className="mx-auto max-w-[680px] px-6 pt-8 pb-20">
        <Button asChild variant="ghost" size="sm" className="mb-10 -ml-3 text-muted-foreground hover:text-primary">
          <Link href="/dashboard/configuracoes">
            <ChevronLeft className="size-[15px]" /> Voltar
          </Link>
        </Button>

        <header className="mb-12">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
            Documento legal
          </span>
          <h1 className="mt-3 font-display font-bold tracking-[-0.01em] text-[clamp(28px,3.5vw,38px)] leading-tight text-[var(--text-strong)]">
            Termos de uso
          </h1>
          <p className="mt-3 text-[12px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Última atualização: maio de 2026
          </p>
        </header>

        <article className="space-y-9 text-[14px] leading-[1.7] text-[var(--text-body)]">
          <p className="aurum-dropcap text-[15px]">
            Bem-vindo ao Aurum. Antes de usar a plataforma, leia estes termos —
            eles definem o que você pode esperar da gente e o que esperamos de
            você. Em português direto, sem letras miúdas escondendo regra
            inconveniente.
          </p>

          <Section title="1. O que o Aurum é">
            <p>
              O Aurum é uma plataforma de organização e educação financeira para
              investidores brasileiros. Oferecemos ferramentas de tracking de
              carteira, calendário de dividendos, gestão de finanças pessoais e
              empresariais, cursos e uma comunidade. <strong>Não somos
              corretora, banco, gestora, consultoria de investimentos nem
              recomendação de compra/venda.</strong>
            </p>
          </Section>

          <Section title="2. O que o Aurum não é">
            <p>
              Nenhum conteúdo, número, gráfico, projeção ou comentário no Aurum
              constitui recomendação de investimento. Decisões financeiras são
              suas. Resultados passados não garantem resultados futuros. Em caso
              de dúvida sobre investir, procure um profissional certificado
              (CVM ou ANBIMA).
            </p>
          </Section>

          <Section title="3. Sua conta">
            <p>
              Você é responsável por manter sua senha em segurança. O Aurum não
              compartilha credenciais com terceiros, e nenhum membro da equipe
              vai te pedir senha por e-mail ou WhatsApp. Se receber pedido
              assim, é golpe — desconfie e nos avise.
            </p>
          </Section>

          <Section title="4. Conteúdo da comunidade">
            <p>
              Ao postar na comunidade, você concorda em não publicar: spam,
              recomendação direta de compra/venda apresentada como conselho
              profissional, conteúdo difamatório, racista, homofóbico ou
              sexualmente explícito, divulgação de dados pessoais de terceiros.
              Posts que violarem estas regras são removidos sem aviso prévio,
              e contas reincidentes são banidas.
            </p>
            <p>
              Você mantém os direitos sobre o conteúdo que publica, mas concede
              ao Aurum licença não exclusiva para exibir esse conteúdo dentro
              da plataforma.
            </p>
          </Section>

          <Section title="5. Disponibilidade do serviço">
            <p>
              Trabalhamos para manter o Aurum disponível 24/7, mas não
              garantimos uptime perfeito. Cotações vêm da brapi e podem
              atrasar ou falhar — o Aurum mostra os dados &ldquo;como
              recebidos&rdquo;, sem responsabilidade por imprecisões da fonte.
            </p>
          </Section>

          <Section title="6. Pagamentos e Premium">
            <p>
              O plano gratuito é gratuito de verdade — sem trial expirando, sem
              cobrança escondida. O Premium é cobrado anualmente via Stripe,
              com 7 dias de garantia incondicional. Cancelamento dentro dos 7
              dias resulta em estorno total. Após esse prazo, o cancelamento
              encerra a renovação automática mas não devolve o valor proporcional.
            </p>
          </Section>

          <Section title="7. Mudanças nestes termos">
            <p>
              Quando atualizamos estes termos de forma material, avisamos por
              e-mail e dentro do app, com pelo menos 15 dias de antecedência.
              Atualizações pequenas (correção de digitação, esclarecimento de
              redação) entram em vigor sem aviso, mas a data acima sempre
              reflete a versão atual.
            </p>
          </Section>

          <Section title="8. Foro e legislação">
            <p>
              Estes termos seguem a legislação brasileira. Conflitos serão
              resolvidos no foro de São Paulo/SP, salvo disposição legal em
              contrário (consumidor pode optar por seu domicílio).
            </p>
          </Section>

          <Section title="9. Contato">
            <p>
              Dúvidas, denúncias ou solicitações jurídicas:{" "}
              <a
                href="mailto:juridico@grupoaurum.com.br"
                className="text-[var(--gold)] aurum-hover-gold aurum-hover-transition"
              >
                juridico@grupoaurum.com.br
              </a>
              .
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[18px] font-semibold text-[var(--text-default)] mb-3 tracking-[-0.005em]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
