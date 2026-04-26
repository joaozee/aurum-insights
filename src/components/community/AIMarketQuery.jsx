import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AIMarketQuery() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "Qual a melhor estratégia para dividendos?",
    "Como funciona o tesouro direto?",
    "Vale a pena investir em FIIs agora?",
    "O que é diversificação de carteira?"
  ];

  const handleQuery = async (question) => {
    try {
      setLoading(true);
      setResponse(null);

      const prompt = `Você é um consultor financeiro brasileiro. Responda de forma clara e objetiva em 2-3 parágrafos curtos.

Pergunta: ${question}

Foque em:
- Resposta direta e prática
- Contexto do mercado brasileiro
- Dicas acionáveis para investidores`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setResponse(result);
      setQuery("");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar pergunta");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleQuery(query);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Pergunte ao AI Advisor
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="mb-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Como investir em ações?"
            className="flex-1 text-sm"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !query.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {!response && !loading && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer text-[10px] hover:bg-violet-50 dark:hover:bg-violet-900/20"
                onClick={() => handleQuery(q)}
              >
                {q}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {response && (
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {response}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResponse(null)}
            className="mt-2 text-xs h-7"
          >
            Nova pergunta
          </Button>
        </div>
      )}
    </Card>
  );
}