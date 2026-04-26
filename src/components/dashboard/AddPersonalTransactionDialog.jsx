import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowDownCircle, ArrowUpCircle, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TransactionCategorizer } from "@/components/ai/TransactionCategorizer";
import { toast } from "sonner";

const PERSONAL_INCOME = [
  { value: "salario", label: "Salário" },
  { value: "pix_recebido", label: "PIX Recebido" },
  { value: "bonus", label: "Bônus" },
  { value: "investimentos", label: "Rendimento de Investimentos" },
  { value: "aluguel_recebido", label: "Aluguel Recebido" },
  { value: "outros", label: "Outros" }
];

const PERSONAL_EXPENSES = [
  { value: "aluguel", label: "Aluguel" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "transporte", label: "Transporte" },
  { value: "saude", label: "Saúde e Farmácia" },
  { value: "educacao", label: "Educação" },
  { value: "lazer", label: "Lazer e Entretenimento" },
  { value: "assinaturas", label: "Assinaturas e Serviços" },
  { value: "roupas", label: "Roupas e Acessórios" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "casa", label: "Casa e Manutenção" },
  { value: "cartao_credito", label: "Pagamento Cartão de Crédito" },
  { value: "seguros", label: "Seguros" },
  { value: "impostos", label: "Impostos e Contribuições" },
  { value: "outros", label: "Outros" }
];

export default function AddPersonalTransactionDialog({ userEmail, onAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categorizingAI, setCategorizingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [formData, setFormData] = useState({
    account_type: "pessoal",
    type: "saida",
    category: "alimentacao",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.FinanceTransaction.create({
        user_email: userEmail,
        account_type: "pessoal",
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date
      });

      if (aiSuggestion && (aiSuggestion.type !== formData.type || aiSuggestion.category !== formData.category)) {
        await TransactionCategorizer.saveFeedback(
          userEmail,
          formData.description,
          parseFloat(formData.amount),
          { type: aiSuggestion.type, category: aiSuggestion.category },
          { type: formData.type, category: formData.category }
        );
      }

      setFormData({
        account_type: "pessoal",
        type: "saida",
        category: "alimentacao",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0]
      });
      setAiSuggestion(null);
      
      setOpen(false);
      onAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const autoCategorize = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Preencha a descrição e o valor primeiro");
      return;
    }

    setCategorizingAI(true);
    try {
      const result = await TransactionCategorizer.categorizeTransaction(
        formData.description,
        formData.amount,
        userEmail
      );

      if (result) {
        setAiSuggestion({ type: result.type, category: result.category });
        
        setFormData(prev => ({
          ...prev,
          type: result.type,
          category: result.category
        }));
        
        const categories = result.type === "entrada" ? PERSONAL_INCOME : PERSONAL_EXPENSES;
        const categoryLabel = categories.find(c => c.value === result.category)?.label || result.category;
        
        const recurringBadge = result.is_recurring ? " 🔄 Recorrente" : "";
        toast.success(`✨ Categorizado: ${categoryLabel} (${result.confidence}% confiança)${recurringBadge}`);
      }
    } catch (error) {
      toast.error("Erro ao categorizar");
      console.error(error);
    } finally {
      setCategorizingAI(false);
    }
  };

  const categories = formData.type === "entrada" ? PERSONAL_INCOME : PERSONAL_EXPENSES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-500 hover:bg-violet-600">
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
         <DialogTitle>Adicionar Transação (Pessoal)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">Tipo</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                type="button"
                variant={formData.type === "entrada" ? "default" : "outline"}
                onClick={() => setFormData({...formData, type: "entrada", category: "salario"})}
                className={formData.type === "entrada" 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "border-gray-700 text-gray-300"
                }
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={formData.type === "saida" ? "default" : "outline"}
                onClick={() => setFormData({...formData, type: "saida", category: "alimentacao"})}
                className={formData.type === "saida" 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "border-gray-700 text-gray-300"
                }
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Saída
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Valor</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Descrição</Label>
            <Textarea
              placeholder="Ex: Almoço no restaurante"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Data</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-700">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-violet-500 hover:bg-violet-600">
              {loading ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}