import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Edit, Trash, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EventDetailsDialog({ open, onClose, event, events = [], onSuccess, onEdit }) {
  const handleDelete = async (eventId) => {
    try {
      await base44.entities.FinancialEvent.delete(eventId);
      toast.success("Evento excluído");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir evento");
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await base44.entities.FinancialEvent.update(eventId, { status: newStatus });
      toast.success("Status atualizado");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      vencimento: "Vencimento",
      meta: "Meta",
      orcamento: "Orçamento",
      transacao: "Transação",
      reuniao: "Reunião",
      outro: "Outro"
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      vencimento: "bg-red-500/20 text-red-400 border-red-500/30",
      meta: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      orcamento: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      transacao: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      reuniao: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      outro: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    };
    return colors[type] || colors.outro;
  };

  if (!event && events.length === 0) return null;

  const displayEvents = event ? [event] : events;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {displayEvents.length === 1 ? "Detalhes do Evento" : `${displayEvents.length} Eventos`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {displayEvents.map((evt) => (
            <div key={evt.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{evt.title}</h3>
                    <Badge className={cn("border", getEventTypeColor(evt.event_type))}>
                      {getEventTypeLabel(evt.event_type)}
                    </Badge>
                  </div>
                  {evt.description && (
                    <p className="text-sm text-gray-400 mb-3">{evt.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(evt)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(evt.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {new Date(evt.event_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>

                {evt.amount && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    R$ {evt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}

                {evt.is_recurring && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    Recorrente ({evt.recurrence_pattern})
                  </div>
                )}

                {evt.category && (
                  <Badge variant="outline" className="border-gray-700 text-gray-300 w-fit">
                    {evt.category}
                  </Badge>
                )}
              </div>

              {evt.event_type === "vencimento" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(evt.id, "pago")}
                    disabled={evt.status === "pago"}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Marcar como Pago
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(evt.id, "cancelado")}
                    disabled={evt.status === "cancelado"}
                    className="border-gray-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}

              {evt.status && evt.event_type === "vencimento" && (
                <Badge className={cn(
                  "border",
                  evt.status === "pago" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  evt.status === "pendente" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  evt.status === "cancelado" && "bg-gray-500/20 text-gray-400 border-gray-500/30"
                )}>
                  {evt.status === "pago" ? "Pago" : evt.status === "pendente" ? "Pendente" : "Cancelado"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}