import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MessagesDialog({ user, open, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const allMessages = await base44.entities.DirectMessage.filter({
        $or: [
          { sender_email: user.email },
          { receiver_email: user.email }
        ]
      }, '-created_date', 100);

      const conversationMap = new Map();
      
      allMessages.forEach(msg => {
        const otherUser = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
        
        if (!conversationMap.has(otherUser)) {
          conversationMap.set(otherUser, {
            user_email: otherUser,
            last_message: msg.message,
            last_message_time: msg.created_date,
            unread_count: 0
          });
        }
        
        if (msg.receiver_email === user.email && !msg.is_read) {
          conversationMap.get(otherUser).unread_count++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const convId = [user.email, selectedConversation].sort().join('_');
      
      const msgs = await base44.entities.DirectMessage.filter({
        conversation_id: convId
      }, 'created_date', 100);

      setMessages(msgs);

      // Mark as read
      const unreadMsgs = msgs.filter(m => 
        m.receiver_email === user.email && !m.is_read
      );
      
      for (const msg of unreadMsgs) {
        await base44.entities.DirectMessage.update(msg.id, {
          is_read: true,
          read_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const convId = [user.email, selectedConversation].sort().join('_');
      
      await base44.entities.DirectMessage.create({
        conversation_id: convId,
        sender_email: user.email,
        receiver_email: selectedConversation,
        message: newMessage,
        is_read: false
      });

      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl h-[600px] p-0">
        <div className="grid grid-cols-5 h-full">
          {/* Conversations List */}
          <div className="col-span-2 border-r border-gray-800 flex flex-col">
            <DialogHeader className="p-4 border-b border-gray-800">
              <DialogTitle>Mensagens</DialogTitle>
            </DialogHeader>

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.user_email}
                  onClick={() => setSelectedConversation(conv.user_email)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      {conv.user_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{conv.user_email.split('@')[0]}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="h-5 w-5 bg-violet-600 rounded-full flex items-center justify-center text-xs">
                      {conv.unread_count}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="col-span-3 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-800">
                  <p className="font-semibold">{selectedConversation.split('@')[0]}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          msg.sender_email === user.email
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_date), { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="bg-gray-800 border-gray-700"
                    />
                    <Button onClick={handleSend} className="bg-violet-600 hover:bg-violet-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Selecione uma conversa
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}