import { TrendingUp, Target, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExecutiveSummary({ data }) {
  const metrics = [
    {
      icon: DollarSign,
      label: "Patrimônio",
      value: data?.patrimonio || "R$ 0",
      color: "text-emerald-400"
    },
    {
      icon: TrendingUp,
      label: "Retorno",
      value: data?.retorno || "0%",
      color: "text-blue-400"
    },
    {
      icon: Target,
      label: "Metas",
      value: data?.metas_progress || "0%",
      color: "text-amber-400"
    },
    {
      icon: AlertCircle,
      label: "Observações",
      value: data?.alertas || "Nenhum",
      color: "text-violet-400"
    }
  ];

  return (
    <Card className="bg-gray-800/50 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-white">Resumo Executivo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-xs text-gray-400">{metric.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}