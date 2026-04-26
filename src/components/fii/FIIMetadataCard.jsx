import { Building2, Users, Percent, Calendar, FileText, TrendingUp, Shield, Clock } from "lucide-react";
import { formatFII, FII_LABELS } from "@/components/utils/fiiService";

export default function FIIMetadataCard({ data }) {
  const meta = data?.metadata;
  if (!meta) return null;

  // Verificar se há algum dado relevante para exibir
  const hasData = meta.segmento || meta.tipo_fundo || meta.gestor || meta.taxa_administracao != null
    || meta.vacancia != null || meta.numero_cotistas || meta.cnpj || meta.razao_social;

  if (!hasData) return null;

  const fields = [
    { icon: Building2, label: "Razão Social", value: meta.razao_social },
    { icon: FileText, label: "CNPJ", value: meta.cnpj },
    { icon: TrendingUp, label: "Segmento", value: meta.segmento ? FII_LABELS.segmento[meta.segmento] || meta.segmento : null },
    { icon: Shield, label: "Tipo do Fundo", value: meta.tipo_fundo ? FII_LABELS.tipo_fundo[meta.tipo_fundo] || meta.tipo_fundo : null },
    { icon: Building2, label: "Mandato", value: meta.mandato ? FII_LABELS.mandato[meta.mandato] || meta.mandato : null },
    { icon: TrendingUp, label: "Gestora", value: meta.gestor },
    { icon: TrendingUp, label: "Administrador", value: meta.administrador },
    { icon: Percent, label: "Taxa de Adm.", value: meta.taxa_administracao != null ? `${meta.taxa_administracao}% a.a.` : null },
    { icon: Percent, label: "Taxa de Performance", value: meta.taxa_performance != null ? `${meta.taxa_performance}%` : null },
    { icon: Building2, label: "Vacância", value: meta.vacancia != null ? `${meta.vacancia}%` : null },
    { icon: Users, label: "Nº de Cotistas", value: meta.numero_cotistas ? formatFII(meta.numero_cotistas, 'number') : null },
    { icon: TrendingUp, label: "Cotas Emitidas", value: meta.cotas_emitidas ? formatFII(meta.cotas_emitidas, 'number') : null },
    { icon: TrendingUp, label: "Valor Patrimonial", value: meta.valor_patrimonial ? formatFII(meta.valor_patrimonial, 'large') : null },
    { icon: TrendingUp, label: "VPC", value: meta.valor_patrimonial_cota ? formatFII(meta.valor_patrimonial_cota, 'currency') : null },
    { icon: Clock, label: "Prazo", value: meta.prazo_duracao === 'indeterminado' ? 'Indeterminado' : meta.prazo_duracao ? 'Determinado' : null },
    { icon: Users, label: "Gestão", value: meta.tipo_gestao === 'ativa' ? 'Ativa' : meta.tipo_gestao === 'passiva' ? 'Passiva' : null },
    { icon: Calendar, label: "Início", value: meta.data_inicio },
    { icon: FileText, label: "ISIN", value: meta.isin },
  ].filter(f => f.value);

  if (!fields.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <h3 className="text-white font-semibold text-lg mb-4">Dados do Fundo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 bg-gray-800/40 rounded-xl p-3">
            <Icon className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-gray-200 text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}