"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  currentUserEmail: string;
  currentUserName: string;
}

const TOPICS = [
  "Dúvida sobre carteira ou dividendos",
  "Erro ou bug na plataforma",
  "Sugestão de funcionalidade",
  "Pagamento, fatura ou cancelamento",
  "Privacidade ou LGPD",
  "Outro assunto",
];

export default function ContatoContent({ currentUserEmail, currentUserName }: Props) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");

  const mailtoHref = (() => {
    const subject = `[Aurum] ${topic}`;
    const body = `${message}\n\n---\nDe: ${currentUserName} <${currentUserEmail}>`;
    return `mailto:suporte@grupoaurum.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  const canSend = message.trim().length >= 10;

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
            Contato
          </span>
          <h1 className="mt-3 font-display font-bold tracking-[-0.01em] text-[clamp(28px,3.5vw,38px)] leading-tight text-[var(--text-strong)]">
            Falar com a gente
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-body)] max-w-[560px]">
            Lemos cada mensagem e respondemos em até 1 dia útil. Para acelerar,
            escolha o assunto e descreva o problema com o máximo de detalhe que
            puder — captura de tela ajuda demais quando há erro visual.
          </p>
        </header>

        <section className="rounded-xl border border-[var(--border-soft)] bg-card p-7">
          <div className="space-y-5">
            <div>
              <Label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                De
              </Label>
              <div className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 py-2.5 text-[13px] text-[var(--text-default)]">
                {currentUserName} <span className="text-muted-foreground">·</span>{" "}
                <span className="text-muted-foreground">{currentUserEmail}</span>
              </div>
            </div>

            <div>
              <Label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2" htmlFor="topic">
                Assunto
              </Label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 py-2.5 text-[13px] text-[var(--text-default)] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2" htmlFor="message">
                Mensagem
              </Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder="Descreva o que aconteceu, em que tela, e o que você esperava que acontecesse..."
                className="w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text-default)] placeholder:text-[var(--text-faint)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
                Mínimo 10 caracteres · {message.trim().length} agora
              </p>
            </div>

            <Button
              asChild={canSend}
              variant="gold"
              size="lg"
              disabled={!canSend}
              className="w-full text-sm font-bold tracking-[0.04em] gap-2"
            >
              {canSend ? (
                <a href={mailtoHref}>
                  <Send size={14} /> Abrir e-mail no seu cliente
                </a>
              ) : (
                <span>
                  <Send size={14} /> Abrir e-mail no seu cliente
                </span>
              )}
            </Button>
            <p className="text-center text-[11px] text-[var(--text-faint)]">
              O botão abre seu cliente de e-mail (Gmail, Outlook, etc.) com a
              mensagem pré-preenchida. Você confirma e envia de lá.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <ContactCard
            title="E-mail direto"
            description="Pra quem prefere escrever direto:"
            actionLabel="suporte@grupoaurum.com.br"
            href="mailto:suporte@grupoaurum.com.br"
            icon={<Mail size={16} className="text-[var(--gold)]" />}
          />
          <ContactCard
            title="Comunidade"
            description="Outros investidores podem ter passado pelo mesmo:"
            actionLabel="Ir para a comunidade"
            href="/dashboard/comunidade"
            icon={<ExternalLink size={16} className="text-[var(--gold)]" />}
          />
        </section>
      </div>
    </div>
  );
}

function ContactCard({
  title, description, actionLabel, href, icon,
}: {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-card p-5">
      <div className="flex items-start gap-3 mb-3">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="font-display text-[14px] font-semibold text-[var(--text-default)] mb-1">
            {title}
          </p>
          <p className="text-[12px] text-[var(--text-body)] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <a
        href={href}
        className="inline-block text-[12px] font-medium text-[var(--gold)] aurum-hover-gold aurum-hover-transition break-all"
      >
        {actionLabel} →
      </a>
    </div>
  );
}
