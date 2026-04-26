import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, Building2, User } from "lucide-react";
import MessageBubble from "@/components/ai/MessageBubble";

export default function FinancialPlannerChat({ userEmail, context = "pessoal" }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const scrollRef = useRef(null);

  const agentName = context === "empresa" 
    ? "business_financial_assistant" 
    : "personal_financial_assistant";

  const title = context === "empresa" 
    ? "Consultor Financeiro Empresarial" 
    : "Consultor Financeiro Pessoal";

  const subtitle = context === "empresa"
    ? "Gestão de despesas e receitas"
    : "Assistente de planejamento";

  const quickActions = context === "empresa" ? [
    { emoji: "💼", text: "Analisar fluxo de caixa" },
    { emoji: "📊", text: "Resumo de despesas operacionais" },
    { emoji: "📈", text: "Como melhorar minha margem?" }
  ] : [
    { emoji: "💰", text: "Analise minha situação financeira atual" },
    { emoji: "📊", text: "Como posso economizar mais?" },
    { emoji: "🎯", text: "Ajude-me a criar um orçamento" }
  ];

  useEffect(() => {
    if (userEmail) {
      loadConversations();
    }
  }, [userEmail, agentName]);

  useEffect(() => {
    if (currentConversation) {
      const unsubscribe = base44.agents.subscribeToConversation(
        currentConversation.id,
        (data) => {
          setMessages(data.messages || []);
          scrollToBottom();
        }
      );

      return () => unsubscribe();
    }
  }, [currentConversation?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const loadConversations = async () => {
    try {
      const convs = await base44.agents.listConversations({
        agent_name: agentName
      });
      setConversations(convs || []);
      
      if (convs && convs.length > 0) {
        setCurrentConversation(convs[0]);
        setMessages(convs[0].messages || []);
      } else {
        await createNewConversation();
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: {
          name: `${context === "empresa" ? "Empresa" : "Pessoal"} - ${new Date().toLocaleDateString('pt-BR')}`,
          description: title,
          user_email: userEmail
        }
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversation || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await base44.agents.addMessage(currentConversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingConversations) {
    return (
      <Card className="bg-gray-900 border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <span className="ml-2 text-gray-400">Carregando...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700 flex flex-col h-[600px]">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-700 ${
        context === "empresa" 
          ? "bg-gradient-to-r from-blue-950/30 to-cyan-950/30" 
          : "bg-gradient-to-r from-violet-950/30 to-purple-950/30"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            context === "empresa"
              ? "bg-blue-500/20"
              : "bg-violet-500/20"
          }`}>
            {context === "empresa" ? (
              <Building2 className="h-5 w-5 text-blue-400" />
            ) : (
              <User className="h-5 w-5 text-violet-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={createNewConversation}
          className="border-gray-700"
        >
          Nova Conversa
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-4">
                Olá! Sou seu {context === "empresa" ? "consultor empresarial" : "consultor financeiro"}. Como posso ajudar você hoje?
              </p>
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.text)}
                    className={`text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm text-gray-300 transition-colors ${
                      context === "empresa" 
                        ? "hover:border-blue-500/20 border border-transparent"
                        : "hover:border-violet-500/20 border border-transparent"
                    }`}
                  >
                    {action.emoji} {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analisando...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta sobre planejamento financeiro..."
            className="bg-gray-800 border-gray-700 text-white"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={context === "empresa" 
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-violet-600 hover:bg-violet-700"
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}