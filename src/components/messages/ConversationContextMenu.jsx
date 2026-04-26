import { MoreVertical, Pin, Archive, MessageSquareOff, Folder, Bell, BellOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ConversationContextMenu({ 
  conversation, 
  metadata,
  onPin, 
  onArchive, 
  onMarkUnread,
  onMute,
  onMoveToFolder,
  onDelete 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
          <Pin className="h-4 w-4 mr-2" />
          {metadata?.is_pinned ? 'Desafixar' : 'Fixar conversa'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkUnread(); }}>
          <MessageSquareOff className="h-4 w-4 mr-2" />
          Marcar como não lida
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMute(); }}>
          {metadata?.muted ? (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Ativar notificações
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Silenciar notificações
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToFolder(); }}>
          <Folder className="h-4 w-4 mr-2" />
          Mover para pasta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
          <Archive className="h-4 w-4 mr-2" />
          {metadata?.is_archived ? 'Desarquivar' : 'Arquivar'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir conversa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}