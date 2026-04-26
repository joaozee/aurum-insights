import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellPlus } from "lucide-react";
import { toast } from "sonner";

export default function QuickPriceAlert({ ticker, currentPrice, userEmail }) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState("qualquer");

  const handleCreate = async () => {
    try {
      if (!targetPrice || !userEmail) {
        toast.error("Defina um preço alvo");
        return;
      }

      await base44.entities.MarketAlert.create({
        user_email: userEmail,
        ticker: ticker,
        alert_type: "preco_alvo",
        target_price: parseFloat(targetPrice),
        reference_price: currentPrice,
        direction: direction,
        is_active: true,
        notify_news: false
      });

      toast.success(`Alerta criado para ${ticker}!`);
      setOpen(false);
      setTargetPrice("");
      setDirection("qualquer");
    } catch (error) {
      toast.error("Erro ao criar alerta");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
          <BellPlus className="h-4 w-4 mr-2" />
          Criar Alerta de Preço
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Alerta de Preço - {ticker}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Preço Atual</p>
            <p className="text-white text-2xl font-bold">
              R$ {currentPrice?.toFixed(2)}
            </p>
          </div>

          <div>
            <Label className="text-gray-300">Preço Alvo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label className="text-gray-300">Notificar quando</Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="acima" className="text-white">Preço subir acima</SelectItem>
                <SelectItem value="abaixo" className="text-white">Preço cair abaixo</SelectItem>
                <SelectItem value="qualquer" className="text-white">Atingir o preço (qualquer direção)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-gray-700 text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="flex-1 bg-violet-600 hover:bg-violet-700">
              <Bell className="h-4 w-4 mr-2" />
              Criar Alerta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}