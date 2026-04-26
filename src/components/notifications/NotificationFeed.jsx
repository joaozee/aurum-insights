import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Trash2,
  Check,
  Zap,
  MessageSquare,
  Heart,
  Users,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Target,
  BookOpen,
  Award,
  DollarSign,
  BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NOTIFICATION_TYPES = {
  "meta_atingida": { icon: Target, color: "text-yellow-400", bg: "bg-yellow-500/10", category: "goals" },
  "variacao_preco": { icon: TrendingUp, color: "text-red-400", bg: "bg-red-500/10", category: "market" },
  "alerta_gastos": { icon: DollarSign, color: "text-orange-400", bg: "bg-orange-500/10", category: "finance" },
  "lembrete_conta": { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10", category: "finance" },
  "analise_ia": { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", category: "market" },
  "lembrete_curso": { icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10", category: "learning" },
  "novo_conteudo": { icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10", category: "learning" },
  "nova_resposta": { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", category: "community" },
  "mencao": { icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", category: "community" },
  "novo_evento": { icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10", category: "community" },
  "comentario_post": { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/10", category: "community" },
  "conquista": { icon: Award, color: "text-yellow-400", bg: "bg-yellow-500/10", category: "achievement" },
  "dividendo": { icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10", category: "market" },
  "analise_acao": { icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10", category: "market" },
  "mentoria": { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", category: "community" }
};

const NOTIFICATION_CATEGORIES = {
  all: { label: "Todas", icon: Bell },
  market: { label: "Mercado", icon: TrendingUp },
  community: { label: "Comunidade", icon: Users },
  learning: { label: "Aprendizado", icon: BookOpen },
  goals: { label: "Metas", icon: Target },
  achievement: { label: "Conquistas", icon: Award },
  finance: { label: "Finanças", icon: DollarSign }
};

export default function NotificationFeed({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [groupByDate, setGroupByDate] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Carregar notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      const data = await base44.entities.Notification.filter(
        { user_email: userEmail },
        "-created_date",
        50
      );
      setNotifications(data || []);
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notif of unreadNotifications) {
        await base44.entities.Notification.update(notif.id, { is_read: true });
      }
      loadNotifications();
      toast.success("Todas as notificações marcadas como lidas");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      loadNotifications();
      toast.success("Notificação removida");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      for (const notif of notifications) {
        await base44.entities.Notification.delete(notif.id);
      }
      loadNotifications();
      toast.success("Todas as notificações removidas");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const typeConfig = NOTIFICATION_TYPES[notif.type] || {};
    
    // Category filter
    if (categoryFilter !== "all" && typeConfig.category !== categoryFilter) return false;
    
    // Severity filter
    if (severityFilter !== "all" && notif.severity !== severityFilter) return false;
    
    // Read/Unread filter
    if (readFilter === "unread" && notif.is_read) return false;
    if (readFilter === "read" && !notif.is_read) return false;
    
    // Search filter
    if (searchQuery && !notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !notif.message?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const groupNotificationsByDate = (notifs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };
    
    notifs.forEach(notif => {
      const notifDate = new Date(notif.created_date);
      notifDate.setHours(0, 0, 0, 0);
      
      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else if (notifDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });
    
    return groups;
  };

  const groupedNotifications = groupByDate ? groupNotificationsByDate(filteredNotifications) : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 bg-gray-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold">
              {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-gray-400 hover:text-white"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllNotifications}
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar notificações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(NOTIFICATION_CATEGORIES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2",
                  categoryFilter === key
                    ? "bg-violet-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters */}
        <div className="flex gap-2 items-center">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-300"
          >
            <option value="all">Todas Severidades</option>
            <option value="info">Info</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="error">Erro</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-300"
          >
            <option value="all">Todas</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
          </select>

          <button
            onClick={() => setGroupByDate(!groupByDate)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              groupByDate ? "bg-violet-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            Agrupar por data
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {groupByDate ? (
            <>
              {groupedNotifications.today.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Hoje</h4>
                  <div className="space-y-3">
                    {groupedNotifications.today.map((notif) => {
                      const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.novo_conteudo;
                      const Icon = typeConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            notif.is_read
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-gray-800 border-gray-600 ring-1 ring-violet-500/50"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn("rounded-lg p-2 flex-shrink-0", typeConfig.bg)}>
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-white font-semibold text-sm">{notif.title}</h4>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  notif.severity === "error" ? "bg-red-500/20 text-red-400" :
                                  notif.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                                  notif.severity === "success" ? "bg-emerald-500/20 text-emerald-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {notif.severity?.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notif.created_date), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>

                                <div className="flex gap-2">
                                  {!notif.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notif.id)}
                                      className="h-6 px-2 text-xs text-gray-400 hover:text-violet-400"
                                    >
                                      Marcar como lida
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notif.id)}
                                    className="h-6 px-2 text-gray-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groupedNotifications.yesterday.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Ontem</h4>
                  <div className="space-y-3">
                    {groupedNotifications.yesterday.map((notif) => {
                      const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.novo_conteudo;
                      const Icon = typeConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            notif.is_read
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-gray-800 border-gray-600 ring-1 ring-violet-500/50"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn("rounded-lg p-2 flex-shrink-0", typeConfig.bg)}>
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-white font-semibold text-sm">{notif.title}</h4>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  notif.severity === "error" ? "bg-red-500/20 text-red-400" :
                                  notif.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                                  notif.severity === "success" ? "bg-emerald-500/20 text-emerald-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {notif.severity?.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notif.created_date), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>

                                <div className="flex gap-2">
                                  {!notif.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notif.id)}
                                      className="h-6 px-2 text-xs text-gray-400 hover:text-violet-400"
                                    >
                                      Marcar como lida
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notif.id)}
                                    className="h-6 px-2 text-gray-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groupedNotifications.thisWeek.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Esta Semana</h4>
                  <div className="space-y-3">
                    {groupedNotifications.thisWeek.map((notif) => {
                      const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.novo_conteudo;
                      const Icon = typeConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            notif.is_read
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-gray-800 border-gray-600 ring-1 ring-violet-500/50"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn("rounded-lg p-2 flex-shrink-0", typeConfig.bg)}>
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-white font-semibold text-sm">{notif.title}</h4>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  notif.severity === "error" ? "bg-red-500/20 text-red-400" :
                                  notif.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                                  notif.severity === "success" ? "bg-emerald-500/20 text-emerald-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {notif.severity?.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {new Date(notif.created_date).toLocaleDateString('pt-BR')}
                                </span>

                                <div className="flex gap-2">
                                  {!notif.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notif.id)}
                                      className="h-6 px-2 text-xs text-gray-400 hover:text-violet-400"
                                    >
                                      Marcar como lida
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notif.id)}
                                    className="h-6 px-2 text-gray-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groupedNotifications.older.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Mais Antigas</h4>
                  <div className="space-y-3">
                    {groupedNotifications.older.map((notif) => {
                      const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.novo_conteudo;
                      const Icon = typeConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            notif.is_read
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-gray-800 border-gray-600 ring-1 ring-violet-500/50"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn("rounded-lg p-2 flex-shrink-0", typeConfig.bg)}>
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-white font-semibold text-sm">{notif.title}</h4>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  notif.severity === "error" ? "bg-red-500/20 text-red-400" :
                                  notif.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                                  notif.severity === "success" ? "bg-emerald-500/20 text-emerald-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {notif.severity?.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {new Date(notif.created_date).toLocaleDateString('pt-BR')}
                                </span>

                                <div className="flex gap-2">
                                  {!notif.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notif.id)}
                                      className="h-6 px-2 text-xs text-gray-400 hover:text-violet-400"
                                    >
                                      Marcar como lida
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notif.id)}
                                    className="h-6 px-2 text-gray-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            filteredNotifications.map((notif) => {
              const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.novo_conteudo;
              const Icon = typeConfig.icon;

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    notif.is_read
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-gray-800 border-gray-600 ring-1 ring-violet-500/50"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn("rounded-lg p-2 flex-shrink-0", typeConfig.bg)}>
                      <Icon className={cn("h-5 w-5", typeConfig.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-white font-semibold text-sm">{notif.title}</h4>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          notif.severity === "error" ? "bg-red-500/20 text-red-400" :
                          notif.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          notif.severity === "success" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {notif.severity?.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm mb-2">{notif.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notif.created_date), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>

                        <div className="flex gap-2">
                          {!notif.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notif.id)}
                              className="h-6 px-2 text-xs text-gray-400 hover:text-violet-400"
                            >
                              Marcar como lida
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notif.id)}
                            className="h-6 px-2 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400 text-sm">
            {searchQuery ? "Nenhuma notificação encontrada" : "Você está em dia! Nenhuma notificação no momento"}
          </p>
        </div>
      )}
    </div>
  );
}