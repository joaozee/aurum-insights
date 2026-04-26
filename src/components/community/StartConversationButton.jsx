import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function StartConversationButton({ currentUserEmail, targetUserEmail, variant = "outline", size = "sm" }) {
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  const handleStartConversation = async () => {
    if (!currentUserEmail || !targetUserEmail) return;

    setStarting(true);
    try {
      // Create a unique conversation ID based on both emails (sorted)
      const conversationId = [currentUserEmail, targetUserEmail].sort().join('_');
      
      // Check if conversation already exists
      const existingMessages = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      }, 'created_date', 1);

      // Navigate to messages page with conversation
      navigate(createPageUrl("Messages") + `?conversation=${conversationId}&email=${targetUserEmail}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar conversa");
    } finally {
      setStarting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartConversation}
      disabled={starting}
    >
      <MessageCircle className="h-4 w-4 mr-1" />
      {starting ? "Carregando..." : "Mensagem"}
    </Button>
  );
}