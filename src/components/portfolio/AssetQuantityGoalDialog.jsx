import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AssetQuantityGoalDialog({ open, onOpenChange, asset, userEmail, onGoalSaved }) {
  const [targetQuantity, setTargetQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetQuantity("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      // Criar uma meta financeira para a quantidade de ações
      await base44.entities.FinancialGoal.create({
        user_email: userEmail,
        title: `${asset.name} - ${targetQuantity} ações`,
        description: `Meta de quantidade de ações para ${asset.name}`,
        target_amount: targetQuantity * asset.current_price,
        current_amount: asset.quantity * asset.current_price,
        target_date: nextYear.toISOString().split('T')[0],
        category: "outro",
        monthly_contribution: 0,
        status: "em_progresso",
        metadata: {
          asset_ticker: asset.name,
          target_quantity: parseInt(targetQuantity),
          current_quantity: asset.quantity,
          current_price: asset.current_price
        }
      });

      toast.success(`Meta de quantidade criada para ${asset.name}!`);
      onOpenChange(false);
      onGoalSaved?.();
    } catch (err) {
      console.error("Erro ao criar meta:", err);
      toast.error("Erro ao criar meta");
    } finally {
      setLoading(false);
    }
  };

  const isValid = targetQuantity && parseInt(targetQuantity) > asset?.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Meta de Quantidade - {asset?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400">Quantidade Atual</p>
            <p className="text-lg font-bold text-white">{asset?.quantity} ações</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Quantidade Alvo de Ações</Label>
            <Input
              type="number"
              step="1"
              min={asset?.quantity || 0}
              placeholder={`Acima de ${asset?.quantity}`}
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              required
            />
            <p className="text-xs text-gray-500">Deve ser maior que {asset?.quantity} ações atuais</p>
          </div>

          {targetQuantity && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Meta de Valor Estimado</p>
              <p className="text-lg font-bold text-violet-400">
                R$ {(parseInt(targetQuantity) * (asset?.current_price || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Diferença: +{(parseInt(targetQuantity) - (asset?.quantity || 0))} ações
              </p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? "Criando..." : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}