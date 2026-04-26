import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, MoreVertical, DollarSign, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { brapiService } from "@/components/utils/brapiService";
import AssetQuantityGoalDialog from "./AssetQuantityGoalDialog";

export default function PortfolioAssetCard({ asset, quote, onUpdate }) {
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [quantityGoal, setQuantityGoal] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [sellData, setSellData] = useState({
    quantity: "",
    price: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  // Use pre-computed fundamentals from asset (calculated in Portfolio page)
  const pbRatio = asset.pb_ratio
    ?? (quote?.priceToBook || null)
    ?? (quote?.regularMarketPrice && quote?.bookValue && quote.bookValue > 0
        ? quote.regularMarketPrice / quote.bookValue
        : null);

  const fundamentals = {
    pe_ratio: asset.pe_ratio ?? (quote?.priceEarnings || quote?.trailingPE || null),
    pb_ratio: pbRatio,
    dy: asset.dy ?? null,
    change_percent: quote?.regularMarketChangePercent || null,
  };

  useEffect(() => {
    loadQuantityGoal();
  }, [asset]);

  const loadQuantityGoal = async () => {
    try {
      const goals = await base44.entities.FinancialGoal.filter({
        user_email: asset.user_email
      });
      
      // Encontrar meta de quantidade para este ativo
      const goal = goals.find(g => 
        g.metadata?.asset_ticker === asset.name && 
        g.metadata?.target_quantity
      );
      
      setQuantityGoal(goal || null);
    } catch (err) {
      console.error("Erro ao carregar meta de quantidade:", err);
    } finally {
      setLoadingGoal(false);
    }
  };

  const totalInvested = asset.quantity * asset.purchase_price;
  const currentValue = asset.quantity * (asset.current_price || asset.purchase_price);
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = (profitLoss / totalInvested) * 100;
  const variationPercent = asset.purchase_price > 0
    ? ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100
    : 0;

  const handleSell = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantity = parseFloat(sellData.quantity);
      const price = parseFloat(sellData.price);

      // Criar transação de venda
      await base44.entities.Transaction.create({
        user_email: asset.user_email,
        ticker: asset.name,
        type: "venda",
        quantity,
        price,
        total_value: quantity * price,
        transaction_date: sellData.date
      });

      setSellDialogOpen(false);
      setSellData({ quantity: "", price: "", date: new Date().toISOString().split('T')[0] });
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 border border-gray-800 rounded-2xl p-6 hover:border-violet-500/30 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {asset.logo_url && (
              <img 
                src={asset.logo_url} 
                alt={asset.name}
                className="h-12 w-12 rounded-full bg-white p-1"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-white mb-1">{asset.name}</h4>
              <p className="text-gray-400 text-sm">{asset.quantity} ações</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={() => setGoalDialogOpen(true)}
                className="text-gray-300 hover:bg-gray-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Meta de Quantidade
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSellDialogOpen(true)}
                className="text-gray-300 hover:bg-gray-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Venda
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta de Quantidade - Mostrada se existir */}
        {!loadingGoal && quantityGoal && (
          <div className="mb-4 bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Target className="h-3 w-3 text-violet-400" />
                Meta de Quantidade
              </span>
              <span className="text-xs font-semibold text-violet-400">
                {((asset.quantity / quantityGoal.metadata.target_quantity) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-300">{asset.quantity} / {quantityGoal.metadata.target_quantity}</span>
              <span className="text-xs text-violet-400">+{quantityGoal.metadata.target_quantity - asset.quantity}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Preço Médio</p>
            <p className="text-white font-semibold">R$ {asset.purchase_price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Preço Atual</p>
            <p className="text-white font-semibold">R$ {asset.current_price?.toFixed(2) || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Valor Atual</p>
            <p className="text-gray-300 font-semibold">R$ {currentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Ganho/Perda</p>
            <p className={profitLoss >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {profitLoss >= 0 ? '+' : ''}R$ {profitLoss.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Rentabilidade</span>
            <div className="flex items-center gap-2">
              {profitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={profitLoss >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {profitLoss >= 0 ? '+' : ''}R$ {profitLoss.toFixed(2)} ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Extra fundamentals row */}
        <div className="pt-3 mt-3 border-t border-gray-800 grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-gray-500 text-[10px] mb-0.5">Variação</p>
            <p className={`text-xs font-semibold ${variationPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {variationPercent >= 0 ? '+' : ''}{variationPercent.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[10px] mb-0.5">P/L</p>
            <p className="text-xs font-semibold text-gray-300">
              {fundamentals?.pe_ratio != null ? fundamentals.pe_ratio.toFixed(2) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[10px] mb-0.5">P/VP</p>
            <p className="text-xs font-semibold text-gray-300">
              {fundamentals?.pb_ratio != null ? fundamentals.pb_ratio.toFixed(2) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[10px] mb-0.5">DY</p>
            <p className="text-xs font-semibold text-amber-400">
              {fundamentals?.dy != null ? `${fundamentals.dy.toFixed(2)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Dialog de Meta de Quantidade */}
      <AssetQuantityGoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        asset={asset}
        userEmail={asset.user_email}
        onGoalSaved={() => {
          loadQuantityGoal();
          onUpdate?.();
        }}
      />

      {/* Dialog de Venda */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Venda - {asset.name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSell} className="space-y-4">
            <div>
              <Label className="text-gray-300">Quantidade (máx: {asset.quantity})</Label>
              <Input
                type="number"
                step="1"
                max={asset.quantity}
                placeholder="100"
                value={sellData.quantity}
                onChange={(e) => setSellData({...sellData, quantity: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-300">Preço de Venda</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="35.50"
                value={sellData.price}
                onChange={(e) => setSellData({...sellData, price: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-300">Data da Venda</Label>
              <Input
                type="date"
                value={sellData.date}
                onChange={(e) => setSellData({...sellData, date: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            {sellData.quantity && sellData.price && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Valor Total da Venda</p>
                <p className="text-amber-400 font-bold text-xl">
                  R$ {(parseFloat(sellData.quantity) * parseFloat(sellData.price)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setSellDialogOpen(false)} className="border-gray-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? "Salvando..." : "Confirmar Venda"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}