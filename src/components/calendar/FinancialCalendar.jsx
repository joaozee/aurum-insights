import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import AddEventDialog from "./AddEventDialog";
import EventDetailsDialog from "./EventDetailsDialog";
import StockEventsSyncButton from "./StockEventsSyncButton";
import { Badge } from "@/components/ui/badge";

export default function FinancialCalendar({ userEmail, accountType = "pessoal" }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (userEmail) {
      loadEvents();
    }
  }, [userEmail, accountType, currentDate]);

  const loadEvents = async () => {
    try {
      const data = await base44.entities.FinancialEvent.filter({
        user_email: userEmail,
        account_type: accountType
      });
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventTypeColor = (type) => {
    const colors = {
      vencimento: "bg-red-500/20 text-red-400",
      meta: "bg-emerald-500/20 text-emerald-400",
      orcamento: "bg-blue-500/20 text-blue-400",
      transacao: "bg-violet-500/20 text-violet-400",
      reuniao: "bg-amber-500/20 text-amber-400",
      outro: "bg-gray-500/20 text-gray-400"
    };
    return colors[type] || colors.outro;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              accountType === "empresa" 
                ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                : "bg-gradient-to-br from-violet-500 to-purple-600"
            }`}>
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{monthName}</h2>
              <p className="text-sm text-gray-400">
                {accountType === "empresa" ? "Calendário Empresarial" : "Calendário Pessoal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accountType === "pessoal" && (
              <StockEventsSyncButton userEmail={userEmail} onSuccess={loadEvents} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={today}
              className="border-gray-700 text-gray-300"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="border-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="border-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className={accountType === "empresa" 
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-violet-600 hover:bg-violet-700"
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day names */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDate(date);
                  if (dayEvents.length === 1) {
                    setSelectedEvent(dayEvents[0]);
                    setDetailsDialogOpen(true);
                  } else if (dayEvents.length > 1) {
                    setSelectedEvent(null);
                    setDetailsDialogOpen(true);
                  }
                }}
                className={cn(
                  "aspect-square p-2 rounded-xl border transition-all relative",
                  isToday && "ring-2 ring-violet-500",
                  dayEvents.length > 0 
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-750" 
                    : "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50"
                )}
              >
                <div className="text-sm font-medium text-white">{day}</div>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1 rounded-full flex-1",
                          event.event_type === "vencimento" && "bg-red-500",
                          event.event_type === "meta" && "bg-emerald-500",
                          event.event_type === "orcamento" && "bg-blue-500",
                          event.event_type === "transacao" && "bg-violet-500",
                          event.event_type === "reuniao" && "bg-amber-500",
                          event.event_type === "outro" && "bg-gray-500"
                        )}
                      />
                    ))}
                  </div>
                )}
                {dayEvents.length > 3 && (
                  <div className="absolute bottom-0 right-1 text-xs text-gray-400">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-400 mb-3">Legenda</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-300">Vencimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-300">Meta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-300">Orçamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-violet-500" />
              <span className="text-xs text-gray-300">Transação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-300">Reunião</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Próximos Eventos</h3>
        <div className="space-y-3">
          {events
            .filter(e => new Date(e.event_date) >= new Date())
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .slice(0, 5)
            .map(event => (
              <button
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setDetailsDialogOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-all"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  event.event_type === "vencimento" && "bg-red-500",
                  event.event_type === "meta" && "bg-emerald-500",
                  event.event_type === "orcamento" && "bg-blue-500",
                  event.event_type === "transacao" && "bg-violet-500",
                  event.event_type === "reuniao" && "bg-amber-500",
                  event.event_type === "outro" && "bg-gray-500"
                )} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.event_date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {event.amount && (
                  <Badge variant="outline" className="border-gray-700 text-gray-300">
                    R$ {event.amount.toLocaleString('pt-BR')}
                  </Badge>
                )}
              </button>
            ))}
          {events.filter(e => new Date(e.event_date) >= new Date()).length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">Nenhum evento próximo</p>
          )}
        </div>
      </Card>

      <AddEventDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        userEmail={userEmail}
        accountType={accountType}
        selectedDate={selectedDate}
        onSuccess={loadEvents}
      />

      <EventDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent}
        events={selectedDate ? getEventsForDate(selectedDate) : []}
        onSuccess={loadEvents}
        onEdit={(event) => {
          setSelectedEvent(event);
          setDetailsDialogOpen(false);
          setAddDialogOpen(true);
        }}
      />
    </div>
  );
}