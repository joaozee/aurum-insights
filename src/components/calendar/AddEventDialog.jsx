import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AddEventDialog({ open, onClose, userEmail, accountType, selectedDate, event, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "vencimento",
    event_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    amount: "",
    is_recurring: false,
    recurrence_pattern: "mensal",
    reminder_enabled: false,
    reminder_days_before: 1,
    status: "pendente",
    category: ""
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        event_type: event.event_type || "vencimento",
        event_date: event.event_date || new Date().toISOString().split('T')[0],
        amount: event.amount || "",
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern || "mensal",
        reminder_enabled: event.reminder_enabled || false,
        reminder_days_before: event.reminder_days_before || 1,
        status: event.status || "pendente",
        category: event.category || ""
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        event_date: selectedDate.toISOString().split('T')[0]
      }));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        user_email: userEmail,
        account_type: accountType,
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null
      };

      if (event) {
        await base44.entities.FinancialEvent.update(event.id, data);
        toast.success("Evento atualizado");
      } else {
        await base44.entities.FinancialEvent.create(data);
        toast.success("Evento criado");
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "vencimento",
      event_date: new Date().toISOString().split('T')[0],
      amount: "",
      is_recurring: false,
      recurrence_pattern: "mensal",
      reminder_enabled: false,
      reminder_days_before: 1,
      status: "pendente",
      category: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="Ex: Pagamento de aluguel"
                required
              />
            </div>

            <div>
              <Label>Tipo de Evento</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="transacao">Transação</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div>
              <Label>Valor (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="bg-gray-800 border-gray-700"
                placeholder="Ex: Moradia, Trabalho"
              />
            </div>

            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-800 border-gray-700"
                rows={3}
                placeholder="Detalhes adicionais..."
              />
            </div>

            <div className="col-span-2 space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Evento Recorrente</Label>
                <Switch
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
                />
              </div>

              {formData.is_recurring && (
                <div>
                  <Label>Padrão de Recorrência</Label>
                  <Select value={formData.recurrence_pattern} onValueChange={(value) => setFormData({...formData, recurrence_pattern: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Ativar Lembrete</Label>
                <Switch
                  checked={formData.reminder_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, reminder_enabled: checked})}
                />
              </div>

              {formData.reminder_enabled && (
                <div>
                  <Label>Lembrar com {formData.reminder_days_before} dia(s) de antecedência</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.reminder_days_before}
                    onChange={(e) => setFormData({...formData, reminder_days_before: parseInt(e.target.value)})}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              )}

              {formData.event_type === "vencimento" && (
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-700">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={accountType === "empresa" 
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-violet-600 hover:bg-violet-700"
              }
            >
              {loading ? "Salvando..." : (event ? "Atualizar" : "Criar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}