import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Bell, Filter, Trash2, CheckCircle, AlertTriangle, Info, TrendingUp, Clock, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function NotificationHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const data = await base44.entities.Notification.filter(
        { user_email: userData.email },
        '-created_date',
        200
      );
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await base44.entities.Notification.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notificação excluída");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir notificação");
    }
  };

  const clearAll = async () => {
    if (!confirm("Tem certeza que deseja excluir todas as notificações?")) return;
    
    try {
      await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
      setNotifications([]);
      toast.success("Todas as notificações foram excluídas");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir notificações");
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = filter === "all" || n.type === filter;
    const severityMatch = severityFilter === "all" || n.severity === severityFilter;
    const searchMatch = searchTerm === "" || 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && severityMatch && searchMatch;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    success: notifications.filter(n => n.severity === "success").length,
    warning: notifications.filter(n => n.severity === "warning").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-12 w-48 bg-gray-800 rounded-lg animate-pulse mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Histórico de Notificações</h1>
                <p className="text-gray-400 text-sm">Revise todos os seus alertas e notificações</p>
              </div>
            </div>
            
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-900 border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.unread}</p>
                  <p className="text-xs text-gray-400">Não Lidas</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.success}</p>
                  <p className="text-xs text-gray-400">Positivas</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.warning}</p>
                  <p className="text-xs text-gray-400">Avisos</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="meta_atingida">Meta Atingida</SelectItem>
                <SelectItem value="variacao_preco">Variação de Preço</SelectItem>
                <SelectItem value="alerta_gastos">Alerta de Gastos</SelectItem>
                <SelectItem value="analise_ia">Análise IA</SelectItem>
                <SelectItem value="lembrete_curso">Lembrete Curso</SelectItem>
                <SelectItem value="novo_conteudo">Novo Conteúdo</SelectItem>
                <SelectItem value="mensagem_direta">Mensagens Diretas</SelectItem>
                <SelectItem value="resposta_comentario">Respostas a Comentários</SelectItem>
                <SelectItem value="mencao">Menções</SelectItem>
                <SelectItem value="conquista">Conquistas</SelectItem>
                <SelectItem value="atualizacao_plataforma">Atualizações da Plataforma</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800 p-12 text-center">
              <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm || filter !== "all" || severityFilter !== "all" 
                  ? "Nenhuma notificação encontrada" 
                  : "Nenhuma notificação"}
              </h3>
              <p className="text-gray-400 text-sm">
                {searchTerm || filter !== "all" || severityFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Suas notificações aparecerão aqui"}
              </p>
            </Card>
          ) : (
            filteredNotifications.map(notif => (
              <Card
                key={notif.id}
                className={cn(
                  "bg-gray-900 border-gray-800 p-5 transition-all hover:border-gray-700",
                  !notif.is_read && "border-violet-500/30 bg-gray-900/80"
                )}
              >
                <div className="flex gap-4">
                  <NotificationIcon type={notif.type} severity={notif.severity} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "text-base font-semibold",
                            notif.is_read ? "text-gray-300" : "text-white"
                          )}>
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <Badge className="bg-violet-500/20 text-violet-400 text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{notif.message}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-400"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.created_date).toLocaleString('pt-BR')}
                        </span>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {notif.type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "text-xs border-gray-700",
                          notif.severity === "success" && "text-emerald-400 border-emerald-500/30",
                          notif.severity === "warning" && "text-amber-400 border-amber-500/30",
                          notif.severity === "error" && "text-red-400 border-red-500/30",
                          notif.severity === "info" && "text-blue-400 border-blue-500/30"
                        )}>
                          {notif.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}