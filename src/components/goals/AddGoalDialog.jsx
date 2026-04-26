import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddGoalDialog({ open, onOpenChange, goal, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: 0,
    current_amount: 0,
    target_date: "",
    category: "outro",
    monthly_contribution: 0,
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    } else {
      setFormData({
        title: "",
        description: "",
        target_amount: 0,
        current_amount: 0,
        target_date: "",
        category: "outro",
        monthly_contribution: 0,
      });
    }
  }, [goal, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            {goal ? "Editar Meta" : "Nova Meta Financeira"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-gray-300">Título</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Aposentadoria, Casa Própria"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-gray-300">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                <SelectItem value="imovel">Imóvel</SelectItem>
                <SelectItem value="viagem">Viagem</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
                <SelectItem value="emergencia">Fundo de Emergência</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-gray-300">Descrição (opcional)</Label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes sobre sua meta"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label className="text-gray-300">Valor Alvo (R$)</Label>
            <Input
              type="number"
              value={formData.target_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_amount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0,00"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Current Amount */}
          <div className="space-y-2">
            <Label className="text-gray-300">Valor Atual (R$)</Label>
            <Input
              type="number"
              value={formData.current_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  current_amount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0,00"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label className="text-gray-300">Data Alvo</Label>
            <Input
              type="date"
              value={formData.target_date}
              onChange={(e) =>
                setFormData({ ...formData, target_date: e.target.value })
              }
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          {/* Monthly Contribution */}
          <div className="space-y-2">
            <Label className="text-gray-300">Contribuição Mensal (R$)</Label>
            <Input
              type="number"
              value={formData.monthly_contribution}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_contribution: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0,00"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              step="0.01"
              min="0"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700"
            >
              {goal ? "Atualizar" : "Criar"} Meta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}