import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, Users, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiscussionSummary({ contentType, contentId, contentTitle, messages }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [contentId]);

  const loadSummary = async () => {
    try {
      const summaries = await base44.entities.DiscussionSummary.filter({
        content_type: contentType,
        content_id: contentId,
      });
      if (summaries.length > 0) {
        setSummary(summaries[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateSummary = async () => {
    if (!messages || messages.length === 0) {
      toast.error("Não há mensagens para resumir");
      return;
    }

    setLoading(true);
    try {
      const messagesText = messages
        .slice(-50)
        .map((m) => `${m.author_name}: ${m.content}`)
        .join("\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise a seguinte discussão da comunidade de investimentos e forneça:
1. Um sumário conciso (3-4 frases)
2. 3-5 pontos-chave principais
3. Sentimento geral (positivo, neutro ou negativo)
4. 2-3 tópicos principais identificados

Discussão:
${messagesText}

Responda em JSON com a estrutura: { summary, keyPoints, sentiment, mainTopics }`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            sentiment: { type: "string" },
            mainTopics: { type: "array", items: { type: "string" } },
          },
        },
      });

      const newSummary = await base44.entities.DiscussionSummary.create({
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
        summary: response.summary,
        key_points: response.keyPoints,
        sentiment: response.sentiment,
        main_topics: response.mainTopics,
        participants_count: new Set(messages.map((m) => m.author_email)).size,
        total_messages: messages.length,
        confidence_score: 85,
      });

      setSummary(newSummary);
      toast.success("Sumário gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar sumário");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-violet-950/30 to-gray-900 border-violet-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-medium text-gray-300">Resumo inteligente disponível</span>
          </div>
          <Button
            onClick={generateSummary}
            disabled={loading}
            className="bg-violet-500 hover:bg-violet-600"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Gerar Sumário
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-violet-950/40 to-gray-900 border-violet-500/40 p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Resumo da Discussão</h4>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(summary.generated_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <Button
            onClick={generateSummary}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="text-violet-400 hover:text-violet-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Sentiment Badge */}
        <div>
          <Badge
            className={`${
              summary.sentiment === "positive"
                ? "bg-green-500/20 text-green-400"
                : summary.sentiment === "negative"
                ? "bg-red-500/20 text-red-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            Sentimento: {summary.sentiment === "positive" ? "Positivo" : summary.sentiment === "negative" ? "Negativo" : "Neutro"}
          </Badge>
        </div>

        {/* Summary */}
        <div>
          <p className="text-sm text-gray-300 leading-relaxed">{summary.summary}</p>
        </div>

        {/* Key Points */}
        <div>
          <h5 className="text-xs font-semibold text-gray-400 mb-2">Pontos-chave:</h5>
          <ul className="space-y-1">
            {summary.key_points?.slice(0, expandedView ? undefined : 3).map((point, idx) => (
              <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {!expandedView && summary.key_points?.length > 3 && (
            <button
              onClick={() => setExpandedView(true)}
              className="text-xs text-violet-400 hover:text-violet-300 mt-2"
            >
              Ver mais ({summary.key_points.length - 3})
            </button>
          )}
        </div>

        {/* Topics & Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400">{summary.participants_count} participantes</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400">{summary.total_messages} mensagens</span>
          </div>
        </div>

        {/* Topics */}
        {summary.main_topics && summary.main_topics.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Tópicos principais:</p>
            <div className="flex flex-wrap gap-2">
              {summary.main_topics.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-gray-700">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}