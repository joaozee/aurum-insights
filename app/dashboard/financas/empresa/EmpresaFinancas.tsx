"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileBarChart,
  Wallet,
  Scale,
  Receipt,
  Layers,
  Plus,
  Building2,
  Check,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  type Company,
  type CostCenter,
  type ApAr,
  type BalanceEntry,
  type FinanceTxRow,
  type Period,
  periodRange,
  computeBalance,
} from "@/lib/empresa-finance";
import { ECard, EButton, E } from "./EmpresaShared";
import EmpresaExecutivo from "./EmpresaExecutivo";
import EmpresaDre from "./EmpresaDre";
import EmpresaFluxo from "./EmpresaFluxo";
import EmpresaBalanco from "./EmpresaBalanco";
import EmpresaContas from "./EmpresaContas";
import EmpresaCentros from "./EmpresaCentros";
import {
  exportApArCsv,
  exportDrePdf,
  exportSped,
  exportTransactionsCsv,
} from "./exporters";

interface Props {
  userEmail: string;
  onOpenTxModal: () => void; // reusa o modal existente da pagina pessoal (com account_type=empresa)
}

type Tab = "executivo" | "dre" | "fluxo" | "balanco" | "contas" | "centros";

const TABS: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "executivo", label: "Executivo", Icon: LayoutDashboard },
  { id: "dre", label: "DRE", Icon: FileBarChart },
  { id: "fluxo", label: "Fluxo", Icon: Wallet },
  { id: "balanco", label: "Balanço", Icon: Scale },
  { id: "contas", label: "Contas", Icon: Receipt },
  { id: "centros", label: "Centros", Icon: Layers },
];

export default function EmpresaFinancas({ userEmail, onOpenTxModal }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("executivo");
  const [period, setPeriod] = useState<Period>("mes");

  // Companies (multiempresa)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Data per company
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [apar, setApar] = useState<ApAr[]>([]);
  const [balanceEntries, setBalanceEntries] = useState<BalanceEntry[]>([]);
  const [txCurrent, setTxCurrent] = useState<FinanceTxRow[]>([]);
  const [txPrev, setTxPrev] = useState<FinanceTxRow[]>([]);
  const [tx12m, setTx12m] = useState<FinanceTxRow[]>([]);

  // Export menu
  const [exportOpen, setExportOpen] = useState(false);

  const selectedCompany = companies.find((c) => c.id === companyId) ?? null;

  // ── Load companies ────────────────────────────────────────────────────────
  const loadCompanies = useCallback(async () => {
    const { data } = await supabase
      .from("company")
      .select("*")
      .eq("owner_email", userEmail)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Company[];
    setCompanies(list);
    if (list.length > 0 && !companyId) {
      const def = list.find((c) => c.is_default) ?? list[0];
      setCompanyId(def.id);
    } else if (list.length === 0) {
      setCompanyId(null);
    }
  }, [supabase, userEmail, companyId]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // ── Load company data ─────────────────────────────────────────────────────
  const loadCompanyData = useCallback(async () => {
    if (!companyId) {
      setCostCenters([]);
      setApar([]);
      setBalanceEntries([]);
      setTxCurrent([]);
      setTxPrev([]);
      setTx12m([]);
      return;
    }

    const today = new Date();
    const range = periodRange(period, today);
    // Mes anterior
    const prevRef = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const prevRange = periodRange(period, prevRef);
    // 12m
    const start12m = new Date(today.getFullYear(), today.getMonth() - 11, 1)
      .toISOString()
      .split("T")[0];
    const end12m = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const [
      ccRes,
      aparRes,
      balRes,
      txCurRes,
      txPrevRes,
      tx12mRes,
    ] = await Promise.all([
      supabase.from("cost_center").select("*").eq("company_id", companyId),
      supabase.from("ap_ar").select("*").eq("company_id", companyId),
      supabase.from("balance_entry").select("*").eq("company_id", companyId),
      supabase
        .from("finance_transaction")
        .select("*")
        .eq("user_email", userEmail)
        .eq("account_type", "empresa")
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .gte("transaction_date", range.from)
        .lte("transaction_date", range.to),
      supabase
        .from("finance_transaction")
        .select("*")
        .eq("user_email", userEmail)
        .eq("account_type", "empresa")
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .gte("transaction_date", prevRange.from)
        .lte("transaction_date", prevRange.to),
      supabase
        .from("finance_transaction")
        .select("*")
        .eq("user_email", userEmail)
        .eq("account_type", "empresa")
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .gte("transaction_date", start12m)
        .lte("transaction_date", end12m),
    ]);

    setCostCenters((ccRes.data ?? []) as CostCenter[]);
    setApar((aparRes.data ?? []) as ApAr[]);
    setBalanceEntries((balRes.data ?? []) as BalanceEntry[]);
    setTxCurrent((txCurRes.data ?? []) as FinanceTxRow[]);
    setTxPrev((txPrevRes.data ?? []) as FinanceTxRow[]);
    setTx12m((tx12mRes.data ?? []) as FinanceTxRow[]);
  }, [supabase, companyId, userEmail, period]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  // Saldo de caixa: pega das entradas do balanco com label contendo "caixa"/"banco"
  const cashBalance = useMemo(() => {
    return balanceEntries
      .filter(
        (e) =>
          e.group_type === "ativo_circulante" &&
          /caixa|banco|conta corrente|aplica/i.test(e.label),
      )
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [balanceEntries]);

  // Sem empresa cadastrada: prompt para criar
  if (companies.length === 0) {
    return (
      <ECard padding="48px 32px">
        <div style={{ textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(201,168,76,0.12)",
              border: `1px solid ${E.borderStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: E.gold,
              margin: "0 auto 18px",
            }}
          >
            <Building2 size={26} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: E.textStrong,
              fontFamily: "var(--font-display)",
              marginBottom: "8px",
              letterSpacing: "-0.01em",
            }}
          >
            Cadastre sua empresa
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: E.textMuted,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            Aurum oferece DRE automático, balanço patrimonial, fluxo de caixa
            projetado, contas a pagar/receber, centros de custo e exportação
            para o seu contador. Comece cadastrando sua empresa.
          </p>
          <EButton variant="gold" onClick={() => setCreatingCompany(true)}>
            <Plus size={13} /> Nova empresa
          </EButton>
        </div>
        {creatingCompany && (
          <CompanyDialog
            userEmail={userEmail}
            onClose={() => setCreatingCompany(false)}
            onSaved={() => {
              setCreatingCompany(false);
              loadCompanies();
            }}
          />
        )}
      </ECard>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub-header empresa: seletor + exportar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          background: E.card,
          border: `1px solid ${E.border}`,
          borderRadius: "10px",
        }}
      >
        {/* Company picker */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setCompanyMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              color: E.text,
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Building2 size={14} style={{ color: E.gold }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "9px", color: E.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1px" }}>
                Empresa
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: E.text }}>
                {selectedCompany?.name ?? "—"}
              </p>
            </div>
            <ChevronDown size={12} style={{ color: E.textMuted, marginLeft: "4px" }} />
          </button>
          {companyMenuOpen && (
            <>
              <div
                onClick={() => setCompanyMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 19 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 20,
                  minWidth: "260px",
                  background: E.card,
                  border: `1px solid ${E.borderStrong}`,
                  borderRadius: "10px",
                  padding: "6px",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
                }}
              >
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCompanyId(c.id);
                      setCompanyMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      background: c.id === companyId ? "rgba(201,168,76,0.08)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      color: E.text,
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = c.id === companyId ? "rgba(201,168,76,0.08)" : "transparent"; }}
                  >
                    <Check
                      size={12}
                      style={{ color: c.id === companyId ? E.gold : "transparent" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600 }}>{c.name}</p>
                      {c.cnpj && (
                        <p style={{ fontSize: "10px", color: E.textMuted, fontVariantNumeric: "tabular-nums" }}>
                          {c.cnpj}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                <div style={{ height: 1, background: E.border, margin: "6px 0" }} />
                <button
                  onClick={() => {
                    setCompanyMenuOpen(false);
                    setCreatingCompany(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    color: E.gold,
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  <Plus size={12} /> Cadastrar nova empresa
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", position: "relative" }}>
          <EButton variant="gold" onClick={onOpenTxModal}>
            <Plus size={13} /> Nova transação
          </EButton>
          <EButton variant="outline" onClick={() => setExportOpen((v) => !v)}>
            <Download size={13} /> Exportar <ChevronDown size={11} />
          </EButton>
          {exportOpen && selectedCompany && (
            <>
              <div
                onClick={() => setExportOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 19 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: 20,
                  minWidth: "240px",
                  background: E.card,
                  border: `1px solid ${E.borderStrong}`,
                  borderRadius: "10px",
                  padding: "6px",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
                }}
              >
                <ExportItem
                  icon={<FileText size={13} />}
                  label="DRE em PDF"
                  hint="Apresentação para banco/sócios"
                  onClick={() => {
                    const r = periodRange(period);
                    exportDrePdf({
                      company: selectedCompany,
                      transactions: txCurrent,
                      periodLabel: r.label,
                    });
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<FileSpreadsheet size={13} />}
                  label="Transações em Excel/CSV"
                  hint="Para o contador"
                  onClick={() => {
                    const r = periodRange(period);
                    exportTransactionsCsv({
                      company: selectedCompany,
                      transactions: txCurrent,
                      periodLabel: r.label,
                    });
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<FileSpreadsheet size={13} />}
                  label="Contas a pagar/receber em CSV"
                  onClick={() => {
                    exportApArCsv({ company: selectedCompany, apar });
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<FileCode size={13} />}
                  label="SPED (.txt)"
                  hint="Esqueleto F100 para contador"
                  onClick={() => {
                    const r = periodRange(period);
                    exportSped({
                      company: selectedCompany,
                      transactions: txCurrent,
                      periodLabel: r.label,
                    });
                    setExportOpen(false);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs empresa */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${E.border}` }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              marginBottom: "-1px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              fontWeight: tab === id ? 600 : 400,
              color: tab === id ? E.gold : E.textMuted,
              borderBottom: tab === id ? `2px solid ${E.gold}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Conteudo */}
      {tab === "executivo" && companyId && (
        <EmpresaExecutivo
          transactionsThisMonth={txCurrent}
          transactionsLastMonth={txPrev}
          transactionsLast12m={tx12m}
          apar={apar}
          cashBalance={cashBalance}
        />
      )}
      {tab === "dre" && companyId && (
        <EmpresaDre
          transactionsCurrent={txCurrent}
          transactionsPrev={txPrev}
          period={period}
          onPeriodChange={setPeriod}
        />
      )}
      {tab === "fluxo" && companyId && (
        <EmpresaFluxo transactions={txCurrent} apar={apar} cashBalance={cashBalance} />
      )}
      {tab === "balanco" && companyId && (
        <EmpresaBalanco companyId={companyId} entries={balanceEntries} onReload={loadCompanyData} />
      )}
      {tab === "contas" && companyId && (
        <EmpresaContas
          companyId={companyId}
          userEmail={userEmail}
          apar={apar}
          costCenters={costCenters}
          onReload={loadCompanyData}
        />
      )}
      {tab === "centros" && companyId && (
        <EmpresaCentros
          companyId={companyId}
          costCenters={costCenters}
          transactions={tx12m}
          apar={apar}
          onReload={loadCompanyData}
        />
      )}

      {creatingCompany && (
        <CompanyDialog
          userEmail={userEmail}
          onClose={() => setCreatingCompany(false)}
          onSaved={() => {
            setCreatingCompany(false);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}

function ExportItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        width: "100%",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 10px",
        borderRadius: "6px",
        color: E.text,
        fontFamily: "var(--font-sans)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ color: E.gold, marginTop: "2px" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: 600, marginBottom: hint ? "1px" : 0 }}>{label}</p>
        {hint && <p style={{ fontSize: "10px", color: E.textMuted }}>{hint}</p>}
      </div>
    </button>
  );
}

function CompanyDialog({
  userEmail,
  onClose,
  onSaved,
}: {
  userEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [taxRegime, setTaxRegime] = useState<"simples" | "lucro_presumido" | "lucro_real" | "mei" | "">("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const { count: existingCount } = await supabase
      .from("company")
      .select("id", { count: "exact", head: true })
      .eq("owner_email", userEmail);
    const isFirst = (existingCount ?? 0) === 0;

    const { error } = await supabase.from("company").insert({
      owner_email: userEmail,
      name: name.trim(),
      cnpj: cnpj.trim() || null,
      trade_name: tradeName.trim() || null,
      tax_regime: taxRegime || null,
      is_default: isFirst,
    });
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar.", { description: error.message });
      return;
    }
    toast.success("Empresa cadastrada.");
    onSaved();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: E.card,
          border: `1px solid ${E.border}`,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: E.textStrong,
            fontFamily: "var(--font-display)",
            marginBottom: "16px",
          }}
        >
          Nova empresa
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <Field label="Razão social">
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus style={inputSt} />
          </Field>
          <Field label="Nome fantasia (opcional)">
            <input value={tradeName} onChange={(e) => setTradeName(e.target.value)} style={inputSt} />
          </Field>
          <Field label="CNPJ (opcional)">
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              style={{ ...inputSt, fontVariantNumeric: "tabular-nums" }}
            />
          </Field>
          <Field label="Regime tributário (opcional)">
            <select
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value as typeof taxRegime)}
              style={inputSt}
            >
              <option value="">— selecionar —</option>
              <option value="mei">MEI</option>
              <option value="simples">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <EButton variant="ghost" onClick={onClose}>Cancelar</EButton>
          <EButton variant="gold" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Salvando…" : "Salvar"}
          </EButton>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          color: E.textMuted,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%",
  background: E.cardSoft,
  border: `1px solid ${E.border}`,
  borderRadius: "6px",
  padding: "8px 12px",
  color: E.text,
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
};
