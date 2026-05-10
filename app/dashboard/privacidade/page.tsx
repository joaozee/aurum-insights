import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidade | Aurum Investimentos",
};

export default async function PrivacidadePage() {
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
            Política de privacidade
          </h1>
          <p className="mt-3 text-[12px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Última atualização: maio de 2026
          </p>
        </header>

        <article className="space-y-9 text-[14px] leading-[1.7] text-[var(--text-body)]">
          <p className="aurum-dropcap text-[15px]">
            O Aurum não vende seus dados nem mostra anúncios. Esta política
            descreve, em português direto, exatamente o que coletamos, por
            que coletamos e o que você pode fazer a respeito. Está em
            conformidade com a LGPD (Lei 13.709/2018).
          </p>

          <Section title="1. Dados que coletamos">
            <p>
              <strong className="text-[var(--text-default)]">Cadastro:</strong>{" "}
              e-mail, nome (opcional), foto e capa de perfil (opcional). Sua
              senha é armazenada com hash bcrypt — a equipe do Aurum não tem
              acesso à senha em texto claro.
            </p>
            <p>
              <strong className="text-[var(--text-default)]">Conteúdo
              financeiro:</strong> ativos da carteira, transações, orçamentos,
              metas e eventos que você cadastra. Tudo armazenado no Supabase
              (Postgres em São Paulo) com Row-Level Security ativada — só você
              consegue ler seus próprios dados.
            </p>
            <p>
              <strong className="text-[var(--text-default)]">Conteúdo
              público:</strong> posts e comentários da comunidade ficam
              visíveis para outros usuários autenticados — é o ponto deles
              existirem. Você pode apagar seus posts a qualquer momento; quando
              apaga, eles saem de toda lista (incluindo notificações).
            </p>
            <p>
              <strong className="text-[var(--text-default)]">Telemetria:</strong>{" "}
              não usamos Google Analytics, Facebook Pixel, Mixpanel nem
              qualquer rastreador de terceiros. Logs do Vercel registram IP,
              user-agent e rotas acessadas para debugging — apagados após 30 dias.
            </p>
          </Section>

          <Section title="2. Por que coletamos">
            <p>
              Cadastro e conteúdo financeiro: para a plataforma fazer o que
              promete (lembrar sua carteira entre sessões, mostrar histórico,
              calcular dividendos). Conteúdo público: para a comunidade
              funcionar. Telemetria: para diagnosticar erros e manter o serviço
              estável.
            </p>
            <p>
              Não usamos seus dados para treinar modelos de IA. Não
              compartilhamos com parceiros para fins de marketing. Não há
              parceiros desse tipo.
            </p>
          </Section>

          <Section title="3. Quem tem acesso">
            <p>
              <strong className="text-[var(--text-default)]">Você:</strong>{" "}
              acesso completo via interface e via export CSV (Carteira →
              Exportar). Política de Row-Level Security do Supabase impede
              acesso de outros usuários ao seu conteúdo privado.
            </p>
            <p>
              <strong className="text-[var(--text-default)]">Equipe técnica do
              Aurum:</strong> acesso ao banco para manutenção e suporte
              direcionado, sob NDA. Não consultamos seus dados rotineiramente.
            </p>
            <p>
              <strong className="text-[var(--text-default)]">Provedores
              técnicos:</strong> Supabase (banco e auth), Vercel (hospedagem
              do app), Stripe (pagamentos do Premium quando ativo), brapi
              (cotações — só recebe ticker, nunca seus dados pessoais).
            </p>
          </Section>

          <Section title="4. Seus direitos LGPD">
            <p>
              Você pode, a qualquer momento, exigir: acesso aos seus dados,
              correção, anonimização, portabilidade, eliminação ou informação
              sobre com quem compartilhamos. Para exercer qualquer direito,
              escreva para{" "}
              <a
                href="mailto:lgpd@grupoaurum.com.br"
                className="text-[var(--gold)] aurum-hover-gold aurum-hover-transition"
              >
                lgpd@grupoaurum.com.br
              </a>
              {" "}— resposta em até 15 dias úteis.
            </p>
            <p>
              Para apagar a conta inteira, peça por e-mail. Em até 5 dias
              úteis, removemos carteira, finanças, posts, comentários e perfil
              de forma irreversível. Logs e backups são apagados em até 30 dias.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              Usamos um único cookie técnico essencial (sessão de autenticação
              do Supabase). Sem cookies de marketing, sem trackers, sem
              consentimento de cookies para mostrar — porque não há nada para
              consentir além do estritamente necessário para login funcionar.
            </p>
          </Section>

          <Section title="6. Mudanças nesta política">
            <p>
              Mudanças materiais avisadas por e-mail e in-app com 15 dias de
              antecedência. Refinamentos editoriais entram sem aviso, com a
              data acima refletindo sempre a versão atual.
            </p>
          </Section>

          <Section title="7. Encarregado de Dados (DPO)">
            <p>
              João Malaquias —{" "}
              <a
                href="mailto:dpo@grupoaurum.com.br"
                className="text-[var(--gold)] aurum-hover-gold aurum-hover-transition"
              >
                dpo@grupoaurum.com.br
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
