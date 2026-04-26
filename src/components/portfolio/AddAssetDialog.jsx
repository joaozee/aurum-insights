import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { brapiService } from "@/components/utils/brapiService";
import TickerAutocomplete from "@/components/shared/TickerAutocomplete";

export default function AddAssetDialog({ userEmail, onAssetAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
    price: "",
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Buscar preço quando ticker ou data mudarem
  useEffect(() => {
    if (formData.ticker && formData.ticker.length >= 4 && formData.transaction_date) {
      const timer = setTimeout(() => {
        fetchPriceForDate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.ticker, formData.transaction_date]);

  const fetchPriceForDate = async () => {
    if (!formData.ticker || !formData.transaction_date) return;
    
    setFetchingPrice(true);
    try {
      const price = await brapiService.getPriceAtDate(formData.ticker, formData.transaction_date);
      if (price) {
        setFormData(prev => ({ ...prev, price: price.toFixed(2) }));
        toast.success(`Preço de ${formData.ticker} carregado: R$ ${price.toFixed(2)}`);
      }
    } catch (err) {
      console.error("Erro ao buscar preço:", err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const price = parseFloat(formData.price);
      const total_value = quantity * price;

      // Criar transação
      await base44.entities.Transaction.create({
        user_email: userEmail,
        ticker: formData.ticker.toUpperCase(),
        type: "compra",
        quantity,
        price,
        total_value,
        transaction_date: formData.transaction_date,
        notes: formData.notes
      });

      toast.success(`Compra de ${formData.ticker} registrada com sucesso!`);
      
      setFormData({
        ticker: "",
        quantity: "",
        price: "",
        transaction_date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      
      setOpen(false);
      
      // Aguardar atualização das métricas
      if (onAssetAdded) {
        await onAssetAdded();
        toast.success("Carteira atualizada com cotações em tempo real!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar compra. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-500 hover:bg-violet-600">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Ativo
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Registrar Compra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">Ticker</Label>
            <TickerAutocomplete
              value={formData.ticker}
              onChange={(ticker) => setFormData({...formData, ticker})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Quantidade</Label>
              <Input
                type="number"
                step="1"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Preço por Ação</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="30.50"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                  disabled={fetchingPrice}
                />
                {fetchingPrice && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-violet-400" />
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Data da Compra</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Observações (opcional)</Label>
            <Textarea
              placeholder="Ex: Compra estratégica para dividend yield"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>

          {formData.quantity && formData.price && (
            <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Valor Total</p>
              <p className="text-violet-400 font-bold text-xl">
                R$ {(parseFloat(formData.quantity) * parseFloat(formData.price)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-700">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-violet-500 hover:bg-violet-600">
              {loading ? "Salvando..." : "Registrar Compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}