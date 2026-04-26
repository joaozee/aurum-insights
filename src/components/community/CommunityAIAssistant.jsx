import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Send, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function CommunityAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Olá! Sou o assistente IA da comunidade. Posso ajudá-lo a encontrar discussões relevantes, responder dúvidas e explorar tendências da comunidade. O que você gostaria de saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente IA especializado em comunidades de investimento. Ajude o usuário a encontrar informações, responda perguntas sobre investimentos e tendências da comunidade.

Histórico da conversa:
${messages.map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Pergunta do usuário: ${input}

Forneça uma resposta concisa e útil (máximo 3 parágrafos).`,
      });

      const assistantMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar mensagem");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/50 flex items-center justify-center z-40"
          size="icon"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 border-l border-gray-800 flex flex-col p-0 w-full sm:w-96">
        <SheetHeader className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            <SheetTitle className="text-white">Assistente IA da Comunidade</SheetTitle>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-violet-500 text-white"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-300 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 px-6 py-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Faça uma pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-gray-800 border-gray-700 text-white"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-violet-500 hover:bg-violet-600"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Pergunte sobre discussões, tendências ou dúvidas de investimento
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}