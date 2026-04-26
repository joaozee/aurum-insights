import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PriceAlertManager({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAlert, setNewAlert] = useState({
    ticker: "",
    alert_type: "preco_acima",
    target_price: 0,
    variation_percent: 5
  });

  useEffect(() => {
    if (open && userEmail) {
      loadAlerts();
    }
  }, [open, userEmail]);

  const loadAlerts = async () => {
    try {
      const data = await base44.entities.PriceAlert.filter({ 
        user_email: userEmail,
        is_active: true 
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAlert = async () => {
    if (!newAlert.ticker) {
      toast.error("Informe o ticker do ativo");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.PriceAlert.create({
        ...newAlert,
        user_email: userEmail,
        is_active: true
      });
      
      toast.success("Alerta criado!");
      setNewAlert({
        ticker: "",
        alert_type: "preco_acima",
        target_price: 0,
        variation_percent: 5
      });
      loadAlerts();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar alerta");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await base44.entities.PriceAlert.delete(alertId);
      toast.success("Alerta removido");
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    if (type === "preco_acima") return <TrendingUp className="h-4 w-4" />;
    if (type === "preco_abaixo") return <TrendingDown className="h-4 w-4" />;
    return <Percent className="h-4 w-4" />;
  };

  const getAlertLabel = (alert) => {
    if (alert.alert_type === "preco_acima") return `Acima de R$ ${alert.target_price}`;
    if (alert.alert_type === "preco_abaixo") return `Abaixo de R$ ${alert.target_price}`;
    return `Variação de ${alert.variation_percent}%`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Bell className="h-4 w-4 mr-2" />
          Alertas de Preço
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-400" />
            Gerenciar Alertas de Preço
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Create New Alert */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="font-medium text-white mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-400" />
              Criar Novo Alerta
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Ticker</Label>
                <Input
                  placeholder="Ex: PETR4"
                  value={newAlert.ticker}
                  onChange={(e) => setNewAlert({ ...newAlert, ticker: e.target.value.toUpperCase() })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Tipo de Alerta</Label>
                <Select
                  value={newAlert.alert_type}
                  onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="preco_acima">Preço Acima de</SelectItem>
                    <SelectItem value="preco_abaixo">Preço Abaixo de</SelectItem>
                    <SelectItem value="variacao_percentual">Variação %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newAlert.alert_type === "preco_acima" || newAlert.alert_type === "preco_abaixo") && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Preço Alvo (R$)</Label>
                  <Input
                    type="number"
                    value={newAlert.target_price}
                    onChange={(e) => setNewAlert({ ...newAlert, target_price: parseFloat(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {newAlert.alert_type === "variacao_percentual" && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Variação (%)</Label>
                  <Input
                    type="number"
                    value={newAlert.variation_percent}
                    onChange={(e) => setNewAlert({ ...newAlert, variation_percent: parseFloat(e.target.value) || 5 })}
                    className="bg-gray-800 border-gray-700"
                    min="1"
                    step="0.5"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleAddAlert}
              disabled={loading || !newAlert.ticker}
              className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
            >
              Criar Alerta
            </Button>
          </div>

          {/* Active Alerts */}
          <div>
            <h4 className="font-medium text-white mb-3">Alertas Ativos ({alerts.length})</h4>
            {alerts.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-800">
                <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum alerta configurado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{alert.ticker}</p>
                        <p className="text-xs text-gray-400">{getAlertLabel(alert)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}