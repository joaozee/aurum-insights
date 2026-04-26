import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Users, Radio, Plus, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_TYPES = {
  webinar: "Webinar",
  qa_session: "Sessão de Q&A",
  workshop: "Workshop",
  palestra: "Palestra",
  networking: "Networking",
};

const CATEGORIES = [
  { id: "renda_fixa", label: "Renda Fixa" },
  { id: "acoes", label: "Ações" },
  { id: "analise_tecnica", label: "Análise Técnica" },
  { id: "planejamento", label: "Planejamento" },
  { id: "geral", label: "Geral" },
];

export default function LiveEventsSection({ userEmail, userName }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "webinar",
    category: "geral",
    start_datetime: "",
    end_datetime: "",
    live_url: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await base44.entities.LiveEvent.list("-start_datetime", 50);
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.start_datetime ||
      !formData.end_datetime
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await base44.entities.LiveEvent.create({
        title: formData.title,
        description: formData.description,
        organizer_email: userEmail,
        organizer_name: userName,
        event_type: formData.event_type,
        category: formData.category,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString(),
        live_url: formData.live_url,
        status: "scheduled",
        speakers: [],
        attendees: [],
        is_free: true,
        chat_enabled: true,
        questions_enabled: true,
      });

      toast.success("Evento criado com sucesso!");
      setFormData({
        title: "",
        description: "",
        event_type: "webinar",
        category: "geral",
        start_datetime: "",
        end_datetime: "",
        live_url: "",
      });
      setOpenDialog(false);
      loadEvents();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar evento");
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      const event = events.find((e) => e.id === eventId);
      const attendees = event.attendees || [];
      const isAlreadyRegistered = attendees.some((a) => a.email === userEmail);

      if (isAlreadyRegistered) {
        toast.info("Você já está registrado neste evento");
        return;
      }

      const updatedAttendees = [
        ...attendees,
        {
          email: userEmail,
          name: userName,
          registered_at: new Date().toISOString(),
          attended: false,
        },
      ];

      await base44.entities.LiveEvent.update(eventId, {
        attendees: updatedAttendees,
      });

      toast.success("Registrado no evento!");
      loadEvents();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao se registrar");
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    if (filterStatus === "upcoming") {
      return events.filter((e) => !isPast(new Date(e.start_datetime)) && e.status !== "cancelled");
    } else if (filterStatus === "live") {
      return events.filter((e) => e.status === "live");
    } else {
      return events.filter((e) => isPast(new Date(e.start_datetime)) && e.status !== "cancelled");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-40 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-400" />
          Eventos ao Vivo
        </h3>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600 gap-2">
              <Plus className="h-4 w-4" />
              Criar Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Título do Evento</label>
                <Input
                  placeholder="Ex: Análise de Ações Blue Chips"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Tipo de Evento</label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(EVENT_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Descreva o evento..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Data/Hora Início</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Data/Hora Fim</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">URL da Transmissão (opcional)</label>
                <Input
                  placeholder="https://..."
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Button onClick={handleCreateEvent} className="w-full bg-red-500 hover:bg-red-600">
                Criar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {["upcoming", "live", "past"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {status === "upcoming"
              ? "Próximos"
              : status === "live"
              ? "Ao Vivo"
              : "Passados"}
          </button>
        ))}
      </div>

      {/* Eventos */}
      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 border-gray-800 p-5 hover:border-red-500/30 transition-all"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {event.status === "live" && (
                  <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center animate-pulse">
                    <Radio className="h-6 w-6 text-red-500" />
                  </div>
                )}
                {event.status === "scheduled" && (
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-red-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{event.title}</h4>
                    <p className="text-sm text-gray-400">{EVENT_TYPES[event.event_type]}</p>
                  </div>
                  {event.status === "live" && (
                    <Badge className="bg-red-500 text-white animate-pulse">AO VIVO</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 mb-2">{event.description}</p>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(event.start_datetime), "dd MMM, HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.attendees?.length || 0} participantes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleRegisterEvent(event.id)}
                    className="bg-red-500 hover:bg-red-600"
                    size="sm"
                  >
                    Registrar
                  </Button>
                  {event.live_url && (
                    <Button
                      variant="outline"
                      className="border-gray-700 text-gray-400 hover:text-white"
                      size="sm"
                      onClick={() => window.open(event.live_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ir para Transmissão
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <Radio className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {filterStatus === "upcoming"
              ? "Nenhum evento próximo"
              : filterStatus === "live"
              ? "Nenhum evento ao vivo"
              : "Nenhum evento passado"}
          </p>
        </Card>
      )}
    </div>
  );
}