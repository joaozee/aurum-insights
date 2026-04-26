import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Info, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationSettings from "./NotificationSettings";

const NotificationIcon = ({ type, severity }) => {
  const icons = {
    meta_atingida: CheckCircle,
    variacao_preco: TrendingUp,
    alerta_gastos: AlertTriangle,
    lembrete_conta: Info,
    analise_ia: Info,
    lembrete_curso: Bell,
    novo_conteudo: Info,
    mensagem_direta: "💬",
    resposta_comentario: "💬",
    mencao: "🏷️",
    conquista: "🏆",
    atualizacao_plataforma: "📢"
  };

  const icon = icons[type];
  const Icon = typeof icon === 'string' ? null : icon;

  const colors = {
    success: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    error: "text-red-400 bg-red-500/10",
    info: "text-blue-400 bg-blue-500/10"
  };

  return (
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg", colors[severity])}>
      {Icon ? <Icon className="h-5 w-5" /> : icon}
    </div>
  );
};

export default function NotificationCenter({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
    }
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      const data = await base44.entities.Notification.filter(
        { user_email: userEmail },
        '-created_date',
        50
      );
      // Filtrar notificações de preço e gastos
      const filtered = data.filter(n => n.type !== 'variacao_preco' && n.type !== 'alerta_gastos');
      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.is_read).length);
    } catch (err) {
      console.error(err);
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
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 border-gray-800 text-white w-full sm:max-w-md">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">Notificações</SheetTitle>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("NotificationHistory")}>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <History className="h-5 w-5" />
                </Button>
              </Link>
              <NotificationSettings userEmail={userEmail} />
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-violet-400 hover:text-violet-300 text-xs"
                >
                  Marcar lidas
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  notif.is_read 
                    ? "bg-gray-800/30 border-gray-800" 
                    : "bg-gray-800/60 border-gray-700"
                )}
              >
                <div className="flex gap-3">
                  <NotificationIcon type={notif.type} severity={notif.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-semibold",
                        notif.is_read ? "text-gray-300" : "text-white"
                      )}>
                        {notif.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-gray-300 -mt-1"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(notif.created_date).toLocaleDateString('pt-BR')}
                      </span>
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notif.id)}
                          className="text-violet-400 hover:text-violet-300 text-xs h-6 px-2"
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}