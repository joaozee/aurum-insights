import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Plus, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MessageBubble from "@/components/ai/MessageBubble";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContextualFinancialAssistant({ accountType = "pessoal" }) {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const agentName = accountType === "empresa" 
    ? "business_financial_assistant" 
    : "personal_financial_assistant";

  const title = accountType === "empresa" 
    ? "Consultor Financeiro Empresarial" 
    : "Consultor Financeiro Pessoal";

  const subtitle = accountType === "empresa"
    ? "Gestão de despesas e receitas da empresa"
    : "Assistente de planejamento";

  const quickActions = accountType === "empresa" ? [
    "Analisar fluxo de caixa",
    "Resumo de despesas operacionais",
    "Como melhorar minha margem?"
  ] : [
    "Analise minha situação financeira atual",
    "Como posso economizar mais?",
    "Ajude-me a criar um orçamento"
  ];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, agentName]);

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
        agent_name: agentName
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
        agent_name: agentName,
        metadata: {
          name: `${accountType === "empresa" ? "Empresa" : "Pessoal"} - ${new Date().toLocaleDateString('pt-BR')}`,
          description: title,
          user_email: user.email
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

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-6">
        <Skeleton className="h-8 w-64 mb-4 bg-gray-800" />
        <Skeleton className="h-64 bg-gray-800" />
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 to-purple-950 p-6 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              {accountType === "empresa" ? (
                <Building2 className="h-6 w-6 text-white" />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-sm text-violet-300">{subtitle}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={createNewConversation}
            className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-950">
        {!currentConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md">
              {accountType === "empresa" 
                ? "Analise despesas, receitas e fluxo de caixa da sua empresa"
                : "Controle de gastos, orçamentos e metas financeiras pessoais"}
            </p>
            <Button
              onClick={createNewConversation}
              className="bg-violet-500 hover:bg-violet-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Iniciar Conversa
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center mb-6">
              Como posso ajudar você hoje?
            </p>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="w-full text-left p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-violet-500/40 transition-all group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {action}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {currentConversation && (
        <div className="border-t border-gray-800 p-4 bg-gray-900">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre planejamento financeiro..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-violet-500 hover:bg-violet-600"
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}