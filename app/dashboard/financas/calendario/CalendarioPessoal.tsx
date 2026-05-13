"use client";

/**
 * CalendarioPessoal — aba Calendário focada em pessoa física.
 *
 * Substitui o calendário plano original por uma camada com:
 *
 *  1) Header rico — mês/ano em Playfair, botão "Hoje", nav < >
 *  2) Resumo do mês — 4 cards (a pagar, a receber, saldo projetado, eventos)
 *  3) Grid calendário — células maiores, heatmap sutil por gastos do dia,
 *     totais de entrada/saída, dots coloridos por tipo de evento, lista compacta
 *     de eventos com até 3 itens + "+N"
 *  4) Lista de próximos eventos — agrupada em "Atrasados", "Esta semana",
 *     "Próximos 30 dias" — cards com badge de data, status e valor
 *
 * Recebe dados via props (events + transactions do mês corrente), zero fetch
 * adicional. Mantém identidade Aurum (preto/dourado + paleta event_type).
 */

import { useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  ArrowDownLeft, ArrowUpRight, Wallet, Layers, AlertCircle,
  RotateCcw, Trash2, Repeat,
} from "lucide-react";
import { EVENT_TYPE_COLORS } from "@/lib/aurum-colors";

// ─── Types (espelham FinancasContent) ─────────────────────────────────────────

export interface FinancialEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  amount: number | null;
  is_recurring: boolean;
  status: string;
  category: string;
}

export interface FinanceTransaction {
  id: string;
  type: "entrada" | "saida";
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
}

interface Props {
  now: Date;
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  events: FinancialEvent[];
  /** Transações do mês corrente (todas que estão na state `transactions`).
   *  Usadas pra calcular totais por dia e heatmap. Quando navegar pra um mês
   *  diferente do atual, os totais ficam ocultos (placeholder) — evita
   *  complexidade de buscar período arbitrário só pra calendário. */
  transactions: FinanceTransaction[];
  onNewEvent: () => void;
  onDeleteEvent?: (e: FinancialEvent) => void;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS_PT_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_PT_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtShort = (v: number) => {
  if (v === 0) return "R$ 0";
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarioPessoal({
  now, calendarDate, setCalendarDate,
  events, transactions, onNewEvent, onDeleteEvent,
}: Props) {
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const isCurrentMonth =
    now.getFullYear() === calYear && now.getMonth() === calMonth;
  const todayKey = isCurrentMonth
    ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : null;

  // ── Agregadores ──────────────────────────────────────────────────────────
  // Eventos do mês visualizado, agrupados por data
  const eventsByDate = useMemo(() => {
    const map: Record<string, FinancialEvent[]> = {};
    events.forEach((e) => {
      const key = e.event_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  // Transações por dia (apenas do mês atual — quando isCurrentMonth)
  const txByDate = useMemo(() => {
    if (!isCurrentMonth) return {};
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const key = t.transaction_date.slice(0, 10);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === "entrada") map[key].income += Number(t.amount);
      else map[key].expense += Number(t.amount);
    });
    return map;
  }, [transactions, isCurrentMonth]);

  // Máximo de gasto diário pro heatmap (escala 0..1)
  const maxDailyExpense = useMemo(() => {
    return Math.max(0, ...Object.values(txByDate).map((d) => d.expense));
  }, [txByDate]);

  // Sumário do mês (do calendarDate)
  const monthSummary = useMemo(() => {
    const monthEvents = events.filter((e) => {
      const d = new Date(e.event_date + "T12:00:00");
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    });
    let toPay = 0;
    let toReceive = 0;
    monthEvents.forEach((e) => {
      if (e.amount == null) return;
      const v = Number(e.amount);
      if (e.event_type === "receita") toReceive += v;
      else if (e.event_type === "vencimento" || e.event_type === "despesa") toPay += v;
    });
    return {
      eventsCount: monthEvents.length,
      toPay,
      toReceive,
      net: toReceive - toPay,
    };
  }, [events, calYear, calMonth]);

  // Agrupamento "Próximos eventos" — usa todos os eventos, não só do mês visualizado
  const upcomingGroups = useMemo(() => {
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7 = new Date(today0);
    in7.setDate(in7.getDate() + 7);
    const in30 = new Date(today0);
    in30.setDate(in30.getDate() + 30);

    const overdue: FinancialEvent[] = [];
    const thisWeek: FinancialEvent[] = [];
    const next30: FinancialEvent[] = [];

    events.forEach((e) => {
      const d = new Date(e.event_date + "T12:00:00");
      // Atrasados: data passada E não foi marcado como concluído/pago
      const isPaid = e.status === "pago" || e.status === "concluido" || e.status === "feito";
      if (d < today0 && !isPaid && (e.event_type === "vencimento" || e.event_type === "despesa")) {
        overdue.push(e);
      } else if (d >= today0 && d <= in7) {
        thisWeek.push(e);
      } else if (d > in7 && d <= in30) {
        next30.push(e);
      }
    });
    // Ordena cada bucket por data
    overdue.sort((a, b) => a.event_date.localeCompare(b.event_date));
    thisWeek.sort((a, b) => a.event_date.localeCompare(b.event_date));
    next30.sort((a, b) => a.event_date.localeCompare(b.event_date));
    return { overdue, thisWeek, next30 };
  }, [events, now]);

  const hasAnyUpcoming =
    upcomingGroups.overdue.length +
    upcomingGroups.thisWeek.length +
    upcomingGroups.next30.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header + nav + resumo */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        padding: "22px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top gold accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "11px",
              background: "linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.04))",
              border: "1px solid rgba(201,168,76,0.18)",
              color: "var(--gold-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <CalendarIcon size={18} />
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-sans)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "4px" }}>
                Calendário financeiro
              </p>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                {MONTHS_PT[calMonth]} <span style={{ color: "var(--gold-light)" }}>{calYear}</span>
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {!isCurrentMonth && (
              <button
                onClick={() => setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1))}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  background: "transparent",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px", padding: "8px 12px",
                  color: "var(--text-muted)", fontSize: "11px", fontWeight: 600,
                  fontFamily: "var(--font-sans)", cursor: "pointer",
                  letterSpacing: "0.02em",
                  transition: "all 150ms var(--ease-out)",
                }}
                className="aurum-hover-gold aurum-hover-border"
                aria-label="Voltar para o mês atual"
              >
                <RotateCcw size={11} /> Hoje
              </button>
            )}
            <NavBtn label="Mês anterior" icon={<ChevronLeft size={15} />} onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} />
            <NavBtn label="Próximo mês" icon={<ChevronRight size={15} />} onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} />
          </div>
        </div>

        {/* Resumo do mês (4 mini-cards) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          <SummaryCard
            label="A pagar"
            value={fmt(monthSummary.toPay)}
            icon={<ArrowUpRight size={13} />}
            tone={monthSummary.toPay > 0 ? "negative" : "neutral"}
          />
          <SummaryCard
            label="A receber"
            value={fmt(monthSummary.toReceive)}
            icon={<ArrowDownLeft size={13} />}
            tone={monthSummary.toReceive > 0 ? "positive" : "neutral"}
          />
          <SummaryCard
            label="Saldo projetado"
            value={fmt(monthSummary.net)}
            icon={<Wallet size={13} />}
            tone={monthSummary.net >= 0 ? "gold" : "negative"}
          />
          <SummaryCard
            label="Eventos no mês"
            value={String(monthSummary.eventsCount)}
            icon={<Layers size={13} />}
            tone="gold"
            suffix={monthSummary.eventsCount === 1 ? "evento" : "eventos"}
          />
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        padding: "20px",
      }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
          {DAYS_PT_SHORT.map((d, i) => (
            <div key={d} style={{
              textAlign: "center",
              fontSize: "10px", fontWeight: 700,
              color: i === 0 || i === 6 ? "var(--gold-dim)" : "var(--text-faint)",
              fontFamily: "var(--font-sans)",
              padding: "6px 0",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e${i}`} style={{
              aspectRatio: "1 / 1",
              minHeight: "84px",
              background: "rgba(255,255,255,0.005)",
              borderRadius: "8px",
            }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate[dateKey] ?? [];
            const tx = txByDate[dateKey] ?? { income: 0, expense: 0 };
            const isToday = dateKey === todayKey;
            const dayOfWeek = new Date(calYear, calMonth, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            // Heatmap intensity (0..1)
            const intensity = maxDailyExpense > 0 ? Math.min(1, tx.expense / maxDailyExpense) : 0;

            return (
              <DayCell
                key={day}
                day={day}
                isToday={isToday}
                isWeekend={isWeekend}
                events={dayEvents}
                income={tx.income}
                expense={tx.expense}
                heatIntensity={intensity}
              />
            );
          })}
        </div>

        {/* Legenda */}
        <div style={{
          display: "flex", gap: "14px", flexWrap: "wrap",
          marginTop: "16px", paddingTop: "14px",
          borderTop: "1px solid var(--border-faint)",
        }}>
          {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{
                fontSize: "10px", color: "var(--text-faint)",
                fontFamily: "var(--font-sans)",
                textTransform: "capitalize",
              }}>
                {type}
              </span>
            </div>
          ))}
          {isCurrentMonth && maxDailyExpense > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}>
              <span style={{
                width: "8px", height: "8px", borderRadius: "2px",
                background: "linear-gradient(90deg, rgba(248,113,113,0.08), rgba(248,113,113,0.45))",
                border: "1px solid rgba(248,113,113,0.3)",
              }} />
              <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
                Intensidade de gastos do dia
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events list */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        padding: "20px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              Próximos eventos
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: "2px" }}>
              Vencimentos, metas e marcos financeiros
            </p>
          </div>
          <button
            onClick={onNewEvent}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))",
              border: "1px solid var(--border-emphasis)",
              borderRadius: "8px", padding: "8px 14px",
              color: "var(--gold-light)", fontSize: "12px", fontWeight: 700,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "all 150ms var(--ease-out)",
            }}
            className="aurum-hover-bg"
          >
            <Plus size={12} /> Novo evento
          </button>
        </div>

        {!hasAnyUpcoming ? (
          <div style={{
            padding: "32px 20px",
            background: "rgba(201,168,76,0.03)",
            border: "1px dashed var(--border-faint)",
            borderRadius: "10px",
            textAlign: "center",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "11px",
              background: "rgba(201,168,76,0.08)", color: "var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <CalendarIcon size={18} />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-default)", fontFamily: "var(--font-display)", marginBottom: "6px" }}>
              Sem eventos próximos
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", maxWidth: "360px", margin: "0 auto", lineHeight: 1.5 }}>
              Adicione vencimentos (boleto, fatura) ou marcos (meta, aposentadoria) pra ter um lembrete visual no calendário.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {upcomingGroups.overdue.length > 0 && (
              <EventGroup
                title="Atrasados"
                subtitle={`${upcomingGroups.overdue.length} ${upcomingGroups.overdue.length === 1 ? "vencimento" : "vencimentos"} em aberto`}
                tone="negative"
                items={upcomingGroups.overdue}
                onDelete={onDeleteEvent}
                now={now}
              />
            )}
            {upcomingGroups.thisWeek.length > 0 && (
              <EventGroup
                title="Esta semana"
                subtitle={`${upcomingGroups.thisWeek.length} ${upcomingGroups.thisWeek.length === 1 ? "evento" : "eventos"} nos próximos 7 dias`}
                tone="gold"
                items={upcomingGroups.thisWeek}
                onDelete={onDeleteEvent}
                now={now}
              />
            )}
            {upcomingGroups.next30.length > 0 && (
              <EventGroup
                title="Próximos 30 dias"
                subtitle={`${upcomingGroups.next30.length} ${upcomingGroups.next30.length === 1 ? "evento" : "eventos"} em até 1 mês`}
                tone="muted"
                items={upcomingGroups.next30}
                onDelete={onDeleteEvent}
                now={now}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "34px", height: "34px",
        background: "rgba(201,168,76,0.06)",
        border: "1px solid var(--border-soft)",
        borderRadius: "8px",
        color: "var(--gold)",
        cursor: "pointer",
        transition: "all 150ms var(--ease-out)",
      }}
      className="aurum-hover-bg aurum-hover-border"
    >
      {icon}
    </button>
  );
}

function SummaryCard({
  label, value, icon, tone, suffix,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "positive" | "negative" | "gold" | "neutral";
  suffix?: string;
}) {
  const toneColor = {
    positive: "var(--positive)",
    negative: "var(--negative)",
    gold: "var(--gold)",
    neutral: "var(--text-muted)",
  }[tone];
  const toneBg = {
    positive: "var(--positive-bg)",
    negative: "var(--negative-bg)",
    gold: "rgba(201,168,76,0.1)",
    neutral: "rgba(154,138,106,0.08)",
  }[tone];
  return (
    <div style={{
      background: "var(--bg-input)",
      border: "1px solid var(--border-faint)",
      borderRadius: "10px",
      padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "6px",
          background: toneBg, color: toneColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <p style={{
          fontSize: "9px", fontWeight: 700, color: "var(--text-faint)",
          fontFamily: "var(--font-sans)", letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          {label}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: "17px", fontWeight: 700,
          color: toneColor,
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          letterSpacing: "-0.005em",
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function DayCell({
  day, isToday, isWeekend, events, income, expense, heatIntensity,
}: {
  day: number;
  isToday: boolean;
  isWeekend: boolean;
  events: FinancialEvent[];
  income: number;
  expense: number;
  heatIntensity: number;
}) {
  const hasEvents = events.length > 0;
  const hasTx = income > 0 || expense > 0;
  const uniqueTypes = Array.from(new Set(events.map((e) => e.event_type)));

  // Border/background priorities:
  //  1. Hoje: ring dourado mais visível
  //  2. Tem evento: borda âmbar sutil
  //  3. Heatmap: tint vermelho na intensidade
  const borderColor = isToday
    ? "var(--gold)"
    : hasEvents
      ? "rgba(201,168,76,0.18)"
      : "rgba(255,255,255,0.04)";
  const heatTint =
    heatIntensity > 0
      ? `rgba(248,113,113,${(0.05 + heatIntensity * 0.18).toFixed(3)})`
      : "transparent";
  const bg = isToday
    ? "rgba(201,168,76,0.08)"
    : heatTint;

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        minHeight: "84px",
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "5px 7px",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "all 150ms var(--ease-out)",
        cursor: hasEvents || hasTx ? "default" : "default",
        boxShadow: isToday ? "0 0 0 1px rgba(201,168,76,0.4), 0 0 12px rgba(201,168,76,0.18)" : "none",
      }}
    >
      {/* Header: número + dots de tipo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
        <span style={{
          fontSize: "11px", fontWeight: isToday ? 700 : 600,
          color: isToday ? "var(--gold-light)" : isWeekend ? "var(--text-faint)" : "var(--text-body)",
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {day}
        </span>
        {uniqueTypes.length > 0 && (
          <div style={{ display: "flex", gap: "2px" }}>
            {uniqueTypes.slice(0, 3).map((t) => (
              <span
                key={t}
                title={t.charAt(0).toUpperCase() + t.slice(1)}
                style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: EVENT_TYPE_COLORS[t] ?? "var(--gold)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lista compacta de eventos (até 2) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minHeight: 0 }}>
        {events.slice(0, 2).map((e) => {
          const c = EVENT_TYPE_COLORS[e.event_type] ?? "var(--gold)";
          return (
            <div
              key={e.id}
              title={`${e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)} · ${e.title}${e.amount ? ` · ${fmt(Number(e.amount))}` : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: "3px",
                fontSize: "9px", color: c,
                background: `${c}1f`,
                borderRadius: "3px",
                padding: "1px 4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
            >
              {e.is_recurring && <Repeat size={7} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.title}
              </span>
            </div>
          );
        })}
        {events.length > 2 && (
          <span style={{
            fontSize: "9px", fontWeight: 600,
            color: "var(--gold)",
            fontFamily: "var(--font-sans)",
            paddingLeft: "4px",
          }}>
            +{events.length - 2}
          </span>
        )}
      </div>

      {/* Footer: totais do dia */}
      {hasTx && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "4px", marginTop: "auto", paddingTop: "3px" }}>
          {income > 0 && (
            <span style={{
              fontSize: "9px", fontWeight: 600, color: "var(--positive)",
              fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              minWidth: 0, flex: 1,
            }}>
              +{fmtShort(income)}
            </span>
          )}
          {expense > 0 && (
            <span style={{
              fontSize: "9px", fontWeight: 600, color: "var(--negative)",
              fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              minWidth: 0, flex: income > 0 ? "0 0 auto" : 1,
              textAlign: "right",
            }}>
              −{fmtShort(expense)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EventGroup({
  title, subtitle, tone, items, onDelete, now,
}: {
  title: string;
  subtitle: string;
  tone: "positive" | "negative" | "gold" | "muted";
  items: FinancialEvent[];
  onDelete?: (e: FinancialEvent) => void;
  now: Date;
}) {
  const toneColor = {
    positive: "var(--positive)",
    negative: "var(--negative)",
    gold: "var(--gold)",
    muted: "var(--text-muted)",
  }[tone];
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, color: toneColor,
          fontFamily: "var(--font-sans)", letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "3px 8px",
          background: `${tone === "negative" ? "rgba(248,113,113,0.1)"
            : tone === "positive" ? "rgba(52,211,153,0.1)"
            : tone === "gold" ? "rgba(201,168,76,0.1)"
            : "rgba(154,138,106,0.08)"}`,
          border: `1px solid ${tone === "negative" ? "rgba(248,113,113,0.25)"
            : tone === "positive" ? "rgba(52,211,153,0.25)"
            : tone === "gold" ? "rgba(201,168,76,0.25)"
            : "rgba(154,138,106,0.15)"}`,
          borderRadius: "5px",
          display: "inline-flex", alignItems: "center", gap: "4px",
        }}>
          {tone === "negative" && <AlertCircle size={10} />}
          {title}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-sans)" }}>
          {subtitle}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((e) => (
          <EventRow key={e.id} event={e} now={now} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

function EventRow({
  event, now, onDelete,
}: { event: FinancialEvent; now: Date; onDelete?: (e: FinancialEvent) => void }) {
  const d = new Date(event.event_date + "T12:00:00");
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((d.getTime() - today0.getTime()) / 86_400_000);
  const accent = EVENT_TYPE_COLORS[event.event_type] ?? "var(--gold)";

  let relativeLabel: string;
  if (diffDays === 0) relativeLabel = "Hoje";
  else if (diffDays === 1) relativeLabel = "Amanhã";
  else if (diffDays === -1) relativeLabel = "Ontem";
  else if (diffDays < 0) relativeLabel = `${Math.abs(diffDays)} dias atrás`;
  else relativeLabel = `em ${diffDays} dias`;

  const dayOfWeek = DAYS_PT_FULL[d.getDay()];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "14px",
      padding: "12px 14px",
      background: "var(--bg-input)",
      border: `1px solid ${accent}22`,
      borderRadius: "10px",
      transition: "border-color 150ms var(--ease-out)",
    }}>
      {/* Badge de data */}
      <div style={{
        width: "48px", height: "52px",
        borderRadius: "10px",
        background: `linear-gradient(180deg, ${accent}22, ${accent}0a)`,
        border: `1px solid ${accent}33`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `inset 0 1px 0 ${accent}1a`,
      }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, color: accent,
          fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
        </span>
        <span style={{
          fontSize: "20px", fontWeight: 700, color: accent,
          fontFamily: "var(--font-display)", lineHeight: 1,
          letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
        }}>
          {d.getDate()}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
          <p style={{
            fontSize: "13px", fontWeight: 600, color: "var(--text-strong)",
            fontFamily: "var(--font-display)", letterSpacing: "-0.005em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {event.title}
          </p>
          {event.is_recurring && (
            <span title="Recorrente" style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontSize: "9px", fontWeight: 700, color: "var(--gold)",
              padding: "2px 6px", borderRadius: "999px",
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.2)",
              fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
            }}>
              <Repeat size={8} strokeWidth={2.5} />
              recorrente
            </span>
          )}
        </div>
        <p style={{
          fontSize: "11px", color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
        }}>
          {dayOfWeek}, {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          {" · "}
          <span style={{ color: accent, fontWeight: 600 }}>{event.event_type}</span>
          {" · "}
          <span style={{ color: diffDays < 0 ? "var(--negative)" : "var(--text-faint)" }}>{relativeLabel}</span>
          {event.category && ` · ${event.category}`}
        </p>
      </div>

      {/* Valor + delete */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {event.amount != null && (
          <span style={{
            fontSize: "14px", fontWeight: 700, color: accent,
            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums",
          }}>
            {fmt(Number(event.amount))}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(event)}
            aria-label="Apagar evento"
            style={{
              width: "26px", height: "26px",
              background: "transparent", border: "1px solid var(--border-faint)",
              borderRadius: "6px",
              color: "var(--text-faint)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms var(--ease-out)",
            }}
            className="aurum-event-del"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
