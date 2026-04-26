import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, X, Loader2, Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import MessageBubble from "@/components/ai/MessageBubble";
import { cn } from "@/lib/utils";

export default function FloatingFinancialAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      loadConversations();
    }
  }, [user, isOpen]);

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
        agent_name: "support_assistant"
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
        agent_name: "support_assistant",
        metadata: {
          name: `Suporte ${new Date().toLocaleDateString('pt-BR')}`,
          description: "Suporte Rápido"
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
    "Como adiciono uma transação?",
    "Onde vejo meu portfólio?",
    "Como funciona o sistema de badges?"
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/50 flex items-center justify-center z-40"
          size="icon"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 border-l border-gray-800 flex flex-col p-0 w-full sm:w-[480px]">
        <SheetHeader className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <SheetTitle className="text-white">Suporte Rápido IA</SheetTitle>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-20 bg-gray-800" />
            <Skeleton className="h-20 bg-gray-800" />
            <Skeleton className="h-20 bg-gray-800" />
          </div>
        ) : (
          <>
            {/* Conversas */}
            <div className="border-b border-gray-800 px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">Conversas</p>
                <Button
                  size="sm"
                  onClick={createNewConversation}
                  className="bg-violet-500/20 hover:bg-violet-500/30 h-7 text-violet-400 border border-violet-500/30"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">Nenhuma conversa</p>
                ) : (
                  conversations.slice(0, 3).map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => {
                        setCurrentConversation(convo);
                        setMessages(convo.messages || []);
                      }}
                      className={cn(
                        "w-full text-left p-2 rounded-lg transition-all text-xs",
                        currentConversation?.id === convo.id
                          ? "bg-violet-500/20 text-violet-400"
                          : "text-gray-400 hover:bg-gray-800"
                      )}
                    >
                      {convo.metadata?.name || "Conversa"}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {!currentConversation ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40 mb-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Suporte Rápido</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Tire dúvidas sobre a plataforma Aurum
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
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Como posso ajudar você hoje?
                  </p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(action)}
                      className="w-full text-left p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-violet-500/40 transition-all"
                    >
                      <span className="text-sm text-gray-300">{action}</span>
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
              <div className="border-t border-gray-800 px-6 py-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Faça uma pergunta..."
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}