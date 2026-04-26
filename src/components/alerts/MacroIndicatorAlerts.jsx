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
import { TrendingUp, TrendingDown, Plus, Trash2, AlertTriangle, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";

export default function MacroIndicatorAlerts({ userEmail }) {
  const [configs, setConfigs] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    indicator_name: "",
    threshold_percent: ""
  });

  useEffect(() => {
    if (userEmail) {
      loadData();
    }
  }, [userEmail]);

  const loadData = async () => {
    try {
      const [configsData, indicatorsData] = await Promise.all([
        base44.entities.MacroAlertConfig.filter({ user_email: userEmail }),
        base44.entities.MacroIndicator.list('-last_updated', 10)
      ]);
      setConfigs(configsData);
      setIndicators(indicatorsData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.indicator_name || !formData.threshold_percent) {
        toast.error("Preencha todos os campos");
        return;
      }

      await base44.entities.MacroAlertConfig.create({
        user_email: userEmail,
        indicator_name: formData.indicator_name,
        threshold_percent: parseFloat(formData.threshold_percent),
        is_active: true
      });

      toast.success("Alerta macroeconômico criado!");
      setOpen(false);
      setFormData({ indicator_name: "", threshold_percent: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao criar alerta");
      console.error(error);
    }
  };

  const handleDelete = async (configId) => {
    try {
      await base44.entities.MacroAlertConfig.delete(configId);
      toast.success("Alerta removido");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover alerta");
    }
  };

  const toggleConfig = async (config) => {
    try {
      await base44.entities.MacroAlertConfig.update(config.id, {
        is_active: !config.is_active
      });
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const getIndicatorIcon = (name) => {
    if (name === "Dolar" || name === "Euro") return DollarSign;
    return Percent;
  };

  const getIndicatorValue = (name) => {
    const indicator = indicators.find(i => i.indicator_name === name);
    return indicator?.current_value || "N/A";
  };

  const getIndicatorVariation = (name) => {
    const indicator = indicators.find(i => i.indicator_name === name);
    return indicator?.variation_percent || 0;
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Indicadores Macroeconômicos
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-1" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Alerta Macroeconômico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Indicador</Label>
                  <Select value={formData.indicator_name} onValueChange={(value) => setFormData({...formData, indicator_name: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="SELIC" className="text-white">SELIC</SelectItem>
                      <SelectItem value="IPCA" className="text-white">IPCA</SelectItem>
                      <SelectItem value="CDI" className="text-white">CDI</SelectItem>
                      <SelectItem value="IGPM" className="text-white">IGP-M</SelectItem>
                      <SelectItem value="Dolar" className="text-white">Dólar</SelectItem>
                      <SelectItem value="Euro" className="text-white">Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Alertar quando variar mais que (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.threshold_percent}
                    onChange={(e) => setFormData({...formData, threshold_percent: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você será notificado quando o indicador variar mais que este percentual
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-gray-700 text-gray-300">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} className="flex-1 bg-amber-600 hover:bg-amber-700">
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Indicators */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {["SELIC", "IPCA", "Dolar", "CDI"].map(name => {
            const value = getIndicatorValue(name);
            const variation = getIndicatorVariation(name);
            const Icon = getIndicatorIcon(name);
            return (
              <div key={name} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{name}</span>
                  </div>
                  {variation !== 0 && (
                    <Badge className={variation > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {variation > 0 ? "+" : ""}{variation.toFixed(2)}%
                    </Badge>
                  )}
                </div>
                <p className="text-white font-semibold">{value}</p>
              </div>
            );
          })}
        </div>

        {/* Configured Alerts */}
        {configs.length === 0 ? (
          <div className="text-center py-6 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Nenhum alerta configurado</p>
          </div>
        ) : (
          <div className="space-y-2 border-t border-gray-800 pt-4">
            {configs.map(config => (
              <div key={config.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={() => toggleConfig(config)}
                  />
                  <div>
                    <p className="text-white font-medium text-sm">{config.indicator_name}</p>
                    <p className="text-gray-400 text-xs">Alertar se variar &gt; {config.threshold_percent}%</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(config.id)}
                  className="h-8 w-8 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}