import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Eye, EyeOff } from "lucide-react";

const AVAILABLE_WIDGETS = [
  { id: "summary", label: "Resumo da Carteira", icon: "📊" },
  { id: "performance", label: "Performance vs Benchmarks", icon: "📈" },
  { id: "allocation", label: "Alocação de Ativos", icon: "🎯" },
  { id: "sector", label: "Distribuição por Setor", icon: "🏭" },
  { id: "top_performers", label: "Melhores Ativos", icon: "⭐" },
  { id: "diversification", label: "Métricas de Diversificação", icon: "📉" },
  { id: "evolution", label: "Evolução da Carteira", icon: "📊" },
  { id: "transactions", label: "Histórico de Transações", icon: "📝" },
  { id: "kpis", label: "KPIs Financeiros", icon: "💹" },
  { id: "alerts", label: "Alertas e Notificações", icon: "🔔" }
];

export default function CustomizableDashboard({ onWidgetsChange }) {
  const [visibleWidgets, setVisibleWidgets] = useState(
    AVAILABLE_WIDGETS.slice(0, 6).map(w => w.id)
  );

  const handleToggleWidget = (widgetId) => {
    const updated = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter(id => id !== widgetId)
      : [...visibleWidgets, widgetId];
    
    setVisibleWidgets(updated);
    onWidgetsChange?.(updated);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <Settings className="h-4 w-4 mr-2" />
          Personalizar Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Personalize seu Dashboard</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {AVAILABLE_WIDGETS.map(widget => (
            <div
              key={widget.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => handleToggleWidget(widget.id)}
            >
              <Checkbox
                checked={visibleWidgets.includes(widget.id)}
                onChange={() => handleToggleWidget(widget.id)}
                className="cursor-pointer"
              />
              <div className="flex items-center gap-2 flex-1">
                <span>{widget.icon}</span>
                <span className="text-sm text-gray-300">{widget.label}</span>
              </div>
              {visibleWidgets.includes(widget.id) ? (
                <Eye className="h-4 w-4 text-violet-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-600" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
          <p className="text-sm text-violet-400">
            {visibleWidgets.length} de {AVAILABLE_WIDGETS.length} widgets visíveis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}