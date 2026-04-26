import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AssetsTable({ assets = [], userEmail, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    purchase_price: "",
    current_price: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assetData = {
        user_email: userEmail,
        name: formData.name,
        type: "acoes",
        quantity: parseFloat(formData.quantity) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        current_price: parseFloat(formData.current_price) || 0,
        current_value: (parseFloat(formData.quantity) || 0) * (parseFloat(formData.current_price) || 0)
      };

      if (editingAsset) {
        await base44.entities.Asset.update(editingAsset.id, assetData);
      } else {
        await base44.entities.Asset.create(assetData);
      }

      setIsOpen(false);
      setEditingAsset(null);
      setFormData({ name: "", quantity: "", purchase_price: "", current_price: "" });
      onUpdate?.();
    } catch (e) {
      console.log(e);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      quantity: asset.quantity?.toString() || "",
      purchase_price: asset.purchase_price?.toString() || "",
      current_price: asset.current_price?.toString() || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (assetId) => {
    try {
      await base44.entities.Asset.delete(assetId);
      onUpdate?.();
    } catch (e) {
      console.log(e);
    }
  };

  const calculateMetrics = (asset) => {
    const invested = (asset.quantity || 0) * (asset.purchase_price || 0);
    const current = (asset.quantity || 0) * (asset.current_price || 0);
    const profitLoss = current - invested;
    const profitLossPercent = invested > 0 ? ((profitLoss / invested) * 100) : 0;
    
    return { invested, current, profitLoss, profitLossPercent };
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Ações em Carteira</h3>
          <p className="text-gray-500 text-sm">Gerencie seus ativos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingAsset(null);
            setFormData({ name: "", quantity: "", purchase_price: "", current_price: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAsset ? "Editar Ação" : "Adicionar Ação"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Ticker</Label>
                <Input
                  id="name"
                  placeholder="Ex: ITUB4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-gray-300">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  placeholder="Ex: 100"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_price" className="text-gray-300">Preço Médio de Compra</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 25.50"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_price" className="text-gray-300">Preço Atual</Label>
                <Input
                  id="current_price"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 28.90"
                  value={formData.current_price}
                  onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  {editingAsset ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma ação adicionada</h3>
          <p className="text-gray-400 mb-4">Comece adicionando suas ações para acompanhar</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Ação</TableHead>
                <TableHead className="text-gray-400 text-right">Qtd</TableHead>
                <TableHead className="text-gray-400 text-right">Preço Médio</TableHead>
                <TableHead className="text-gray-400 text-right">Preço Atual</TableHead>
                <TableHead className="text-gray-400 text-right">Investido</TableHead>
                <TableHead className="text-gray-400 text-right">Atual</TableHead>
                <TableHead className="text-gray-400 text-right">Lucro/Prejuízo</TableHead>
                <TableHead className="text-gray-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.filter(a => a.type === "acoes").map((asset) => {
                const metrics = calculateMetrics(asset);
                const isProfit = metrics.profitLoss >= 0;

                return (
                  <TableRow key={asset.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium text-white">{asset.name}</TableCell>
                    <TableCell className="text-right text-gray-300">{asset.quantity}</TableCell>
                    <TableCell className="text-right text-gray-300">
                      R$ {asset.purchase_price?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right text-gray-300">
                      R$ {asset.current_price?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right text-gray-300">
                      R$ {metrics.invested.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-white font-semibold">
                      R$ {metrics.current.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isProfit ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span className={isProfit ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                          {isProfit ? "+" : ""}R$ {metrics.profitLoss.toFixed(2)}
                        </span>
                        <span className={isProfit ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
                          ({isProfit ? "+" : ""}{metrics.profitLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(asset)}
                          className="h-8 w-8 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(asset.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}