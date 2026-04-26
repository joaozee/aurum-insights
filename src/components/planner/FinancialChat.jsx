import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABELS = {
  salario: "Salário",
  pix_recebido: "PIX Recebido",
  bonus: "Bônus",
  aluguel: "Aluguel",
  alimentacao: "Alimentação",
  lazer: "Lazer",
  cartao_credito: "Cartão Crédito",
  assinaturas: "Assinaturas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros"
};

export default function FinancialChat({ userEmail, goals }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Olá! 👋 Sou seu assistente de finanças pessoais. Posso ajudar você com:\n\n📊 Análises de gastos\n💰 Relatórios sobre categorias específicas\n🎯 Dicas para otimizar seu orçamento\n📈 Projeções para suas metas\n\nO que gostaria de saber sobre suas finanças?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadTransactions();
  }, [userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTransactions = async () => {
    try {
      if (userEmail) {
        const data = await base44.entities.FinanceTransaction.filter({
          user_email: userEmail
        });
        setTransactions(data);
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const formatTransactionsSummary = () => {
    if (transactions.length === 0) return "Sem transações registradas";

    const expenses = transactions.filter(t => t.type === "saida");
    const income = transactions.filter(t => t.type === "entrada");

    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

    const categorySummary = Object.entries(expensesByCategory)
      .map(([cat, val]) => `${CATEGORY_LABELS[cat] || cat}: R$ ${val.toFixed(2)}`)
      .join(", ");

    return `Renda Total: R$ ${totalIncome.toFixed(2)}, Gastos: R$ ${totalExpenses.toFixed(2)}, Detalhes: ${categorySummary}`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const prompt = `Você é um assistente especializado em finanças pessoais. Responda às perguntas do usuário de forma prática e útil.

**DADOS DO USUÁRIO:**
${formatTransactionsSummary()}

**METAS:**
${goals?.map(g => `- ${g.title}: R$ ${g.target_amount.toLocaleString('pt-BR')} (prazo: ${g.target_date})`).join('\n') || 'Nenhuma meta registrada'}

**PERGUNTA DO USUÁRIO:**
${input}

Forneça uma resposta clara, concisa e prática. Se o usuário pedir um relatório, forneça dados específicos. Se pedir análise, compare com benchmarks de finanças pessoais.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Erro ao processar mensagem");
      console.error(error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-transparent">
      {/* Chat Container */}
      <Card className="flex-1 bg-gray-900 border-gray-800 rounded-lg flex flex-col">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-gray-800">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Assistente de Finanças Pessoais
          </CardTitle>
          <p className="text-gray-400 text-sm mt-1">Pergunte sobre seus gastos, metas e dicas de economia</p>
        </CardHeader>

        <CardContent className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 px-4 py-3 rounded-lg rounded-bl-none border border-gray-700">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Pergunta sobre seus gastos, metas..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 px-3"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}