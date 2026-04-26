import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sparkles } from 'lucide-react';

export default function IntelligentPlanningChat({ transactions, userEmail }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Olá! Sou seu assistente de planejamento financeiro. 💡\n\nConte-me: o que você gostaria de melhorar nas suas finanças? Por exemplo:\n- "Quero reduzir gastos com transporte"\n- "Preciso economizar para uma viagem"\n- "Meus gastos com alimentação estão altos"'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type: 'user',
      content: userMessage
    }]);

    setLoading(true);

    try {
      const response = await base44.functions.invoke('intelligentPlanningAssistant', {
        userMessage,
        transactions
      });

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        content: response.data.response
      }]);

      if (response.data.goalsCreated > 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: 'bot',
          content: `✅ Criei ${response.data.goalsCreated} meta(s) para você!`,
          isSuccess: true
        }]);
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        content: 'Desculpe, ocorreu um erro. Tente novamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-screen max-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-white" />
        <div>
          <h3 className="font-semibold text-white">Assistente de Planejamento</h3>
          <p className="text-xs text-violet-100">Crie metas e alertas de gastos</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg text-sm ${
                msg.type === 'user'
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : msg.isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-bl-none'
                  : 'bg-gray-800 text-gray-100 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Descreva o que quer melhorar..."
            className="bg-gray-800 border-gray-700 text-white"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}