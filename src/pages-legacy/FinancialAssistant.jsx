import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus,
  MessageSquare,
  TrendingUp,
  FileText,
  Target,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import MessageBubble from "@/components/ai/MessageBubble";
import ReportFilter from "@/components/financial-assistant/ReportFilter";
import ExecutiveSummary from "@/components/financial-assistant/ExecutiveSummary";

export default function FinancialAssistant() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentConversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [currentConversation?.id]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "financial_advisor"
      });
      setConversations(convos);
      
      if (convos.length > 0) {
        setCurrentConversation(convos[0]);
        setMessages(convos[0].messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewConversation = async () => {
    try {
      const newConvo = await base44.agents.createConversation({
        agent_name: "financial_advisor",
        metadata: {
          name: `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
          description: "Assistente Financeiro"
        }
      });
      
      setConversations([newConvo, ...conversations]);
      setCurrentConversation(newConvo);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !currentConversation || sending) return;

    const userMessage = input;
    setInput("");
    setSending(true);

    try {
      await base44.agents.addMessage(currentConversation, {
        role: "user",
        content: userMessage
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const quickActions = [
    {
      icon: FileText,
      label: "Relatório Completo",
      prompt: "Gere um relatório financeiro resumido com:\n- Resumo do patrimônio e retorno\n- Performance vs Ibovespa (últimos 3 meses)\n- Top 3 melhores ativos\n- 1 recomendação de compra\n\nSeja conciso e direto."
    },
    {
      icon: TrendingUp,
      label: "Análise de Investimentos",
      prompt: "Análise rápida do portfólio:\n- 3 setores com melhor performance\n- 2 ativos subencarregados\n- 1 oportunidade de compra\n- Risco geral da carteira\n\nUse números, sem textos longos."
    },
    {
      icon: Target,
      label: "Plano de Metas",
      prompt: "Mostre:\n- Progresso das metas em %\n- Aporte mensal necessário\n- Data estimada para atingir\n- 1 dica para acelerar\n\nBe practical and brief."
    }
  ];

  const handleQuickAction = async (prompt) => {
    if (!currentConversation) {
      await createNewConversation();
      // Aguardar um momento para o conversation ser criado
      setTimeout(() => {
        setInput(prompt);
      }, 500);
    } else {
      setInput(prompt);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950/30 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8 bg-gray-800" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-[600px] bg-gray-800" />
            <Skeleton className="lg:col-span-2 h-[600px] bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950/30 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Assistente Financeiro IA</h1>
              <p className="text-sm text-gray-400">Relatórios, conselhos e planos personalizados</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Conversas */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Conversas</h2>
                <Button
                  size="sm"
                  onClick={createNewConversation}
                  className="bg-violet-500 hover:bg-violet-600 h-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => {
                        setCurrentConversation(convo);
                        setMessages(convo.messages || []);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all",
                        currentConversation?.id === convo.id
                          ? "bg-violet-500/20 border border-violet-500/40"
                          : "bg-gray-800/50 border border-gray-700 hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Bot className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">
                            {convo.metadata?.name || "Nova Conversa"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(convo.created_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-200px)] lg:h-[600px]">
              {!currentConversation ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Assistente Financeiro</h2>
                  <p className="text-gray-400 text-center mb-8 max-w-md">
                    Obtenha relatórios personalizados, conselhos de investimento e planos para suas metas
                  </p>

                  {/* Quick Actions */}
                  <div className="grid gap-3 w-full max-w-lg">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-violet-500/40 transition-all text-left group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
                          <action.icon className="h-5 w-5 text-violet-400" />
                        </div>
                        <span className="text-sm text-white group-hover:text-violet-400 transition-colors">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={createNewConversation}
                    className="mt-6 bg-violet-500 hover:bg-violet-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conversa
                  </Button>
                </div>
              ) : (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Bot className="h-12 w-12 text-violet-400 mb-4" />
                        <p className="text-gray-400 text-center mb-6">
                          Como posso ajudar com suas finanças hoje?
                        </p>
                        <div className="grid gap-2 w-full max-w-md">
                          {quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInput(action.prompt)}
                              className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-violet-500/40 transition-all text-left text-sm group"
                            >
                              <action.icon className="h-4 w-4 text-violet-400" />
                              <span className="text-gray-300 group-hover:text-white">
                                {action.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <ReportFilter period={period} onPeriodChange={setPeriod} />
                        <ExecutiveSummary data={{
                          patrimonio: "R$ 125.430",
                          retorno: "+12.5%",
                          metas_progress: "65%",
                          alertas: "1 ativo em queda"
                        }} />
                        {messages.map((msg, idx) => (
                          <MessageBubble key={idx} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Peça relatórios, conselhos ou planos financeiros..."
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        disabled={sending}
                      />
                      <Button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="bg-violet-500 hover:bg-violet-600 disabled:opacity-50"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}