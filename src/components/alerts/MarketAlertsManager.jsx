import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Newspaper, Activity } from "lucide-react";
import { toast } from "sonner";

export default function MarketAlertsManager({ userEmail }) {
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ticker: "",
    alert_type: "preco_alvo",
    target_price: "",
    variation_percent: "",
    direction: "qualquer",
    notify_news: false
  });

  useEffect(() => {
    if (userEmail) {
      loadData();
    }
  }, [userEmail]);

  const loadData = async () => {
    try {
      const [alertsData, assetsData] = await Promise.all([
        base44.entities.MarketAlert.filter({ user_email: userEmail }),
        base44.entities.Asset.filter({ user_email: userEmail })
      ]);
      setAlerts(alertsData);
      setAssets(assetsData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.ticker) {
        toast.error("Selecione um ativo");
        return;
      }

      // Get current price for reference
      const asset = assets.find(a => a.name === formData.ticker);
      
      await base44.entities.MarketAlert.create({
        user_email: userEmail,
        ticker: formData.ticker,
        alert_type: formData.alert_type,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        variation_percent: formData.variation_percent ? parseFloat(formData.variation_percent) : null,
        reference_price: asset?.current_price || 0,
        direction: formData.direction,
        notify_news: formData.notify_news,
        is_active: true
      });

      toast.success("Alerta criado!");
      setOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error("Erro ao criar alerta");
      console.error(error);
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await base44.entities.MarketAlert.delete(alertId);
      toast.success("Alerta removido");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover alerta");
    }
  };

  const toggleAlert = async (alert) => {
    try {
      await base44.entities.MarketAlert.update(alert.id, {
        is_active: !alert.is_active
      });
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar alerta");
    }
  };

  const resetForm = () => {
    setFormData({
      ticker: "",
      alert_type: "preco_alvo",
      target_price: "",
      variation_percent: "",
      direction: "qualquer",
      notify_news: false
    });
  };

  const getAlertIcon = (type) => {
    const icons = {
      preco_alvo: TrendingUp,
      variacao_percentual: Activity,
      noticias: Newspaper,
      volume: BarChart3
    };
    return icons[type] || Bell;
  };

  const getAlertDescription = (alert) => {
    if (alert.alert_type === "preco_alvo") {
      const dir = alert.direction === "acima" ? "acima de" : alert.direction === "abaixo" ? "abaixo de" : "atingir";
      return `${dir} R$ ${alert.target_price?.toFixed(2)}`;
    }
    if (alert.alert_type === "variacao_percentual") {
      return `variação de ${alert.variation_percent}%`;
    }
    if (alert.alert_type === "noticias") {
      return "notícias relevantes";
    }
    return "alerta ativo";
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-400" />
            Alertas de Mercado
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-1" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Criar Alerta de Mercado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Ativo</Label>
                  <Select value={formData.ticker} onValueChange={(value) => setFormData({...formData, ticker: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o ativo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.name} className="text-white">
                          {asset.name} - R$ {asset.current_price?.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Tipo de Alerta</Label>
                  <Select value={formData.alert_type} onValueChange={(value) => setFormData({...formData, alert_type: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="preco_alvo" className="text-white">Preço Alvo</SelectItem>
                      <SelectItem value="variacao_percentual" className="text-white">Variação %</SelectItem>
                      <SelectItem value="noticias" className="text-white">Notícias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.alert_type === "preco_alvo" && (
                  <>
                    <div>
                      <Label className="text-gray-300">Preço Alvo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.target_price}
                        onChange={(e) => setFormData({...formData, target_price: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Direção</Label>
                      <Select value={formData.direction} onValueChange={(value) => setFormData({...formData, direction: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="acima" className="text-white">Acima do preço</SelectItem>
                          <SelectItem value="abaixo" className="text-white">Abaixo do preço</SelectItem>
                          <SelectItem value="qualquer" className="text-white">Qualquer direção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {formData.alert_type === "variacao_percentual" && (
                  <div>
                    <Label className="text-gray-300">Variação % (positiva ou negativa)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.variation_percent}
                      onChange={(e) => setFormData({...formData, variation_percent: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="5.0"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Label className="text-gray-300">Notificar sobre notícias</Label>
                  <Switch
                    checked={formData.notify_news}
                    onCheckedChange={(checked) => setFormData({...formData, notify_news: checked})}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-gray-700 text-gray-300">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} className="flex-1 bg-violet-600 hover:bg-violet-700">
                    Criar Alerta
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum alerta configurado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const Icon = getAlertIcon(alert.alert_type);
              return (
                <div key={alert.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${alert.is_active ? 'bg-violet-500/20' : 'bg-gray-700/50'}`}>
                        <Icon className={`h-4 w-4 ${alert.is_active ? 'text-violet-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">{alert.ticker}</span>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{getAlertDescription(alert)}</p>
                        {alert.notify_news && (
                          <div className="flex items-center gap-1 mt-2">
                            <Newspaper className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-blue-400">Notícias ativadas</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => toggleAlert(alert)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alert.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}