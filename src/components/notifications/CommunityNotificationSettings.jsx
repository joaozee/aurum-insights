import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Bell, MessageSquare, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";
import { toast } from "sonner";

export default function CommunityNotificationSettings({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    direct_messages_enabled: true,
    follower_alerts: true,
    post_likes_enabled: true,
    comments_enabled: true,
    mentions_enabled: true,
    followed_posts_enabled: true,
    notification_frequency: "tempo_real",
    email_notifications_enabled: true,
    email_for_critical_only: false,
    push_notifications_enabled: true,
  });

  useEffect(() => {
    if (open && userEmail) {
      loadSettings();
    }
  }, [open, userEmail]);

  const loadSettings = async () => {
    try {
      const data = await base44.entities.NotificationSettings.filter({ 
        user_email: userEmail 
      });
      if (data.length > 0) {
        setSettings(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.NotificationSettings.filter({ 
        user_email: userEmail 
      });
      
      if (existing.length > 0) {
        await base44.entities.NotificationSettings.update(existing[0].id, settings);
      } else {
        await base44.entities.NotificationSettings.create({
          ...settings,
          user_email: userEmail
        });
      }
      
      toast.success("Configurações salvas!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    {
      key: "direct_messages_enabled",
      icon: MessageSquare,
      label: "Mensagens Diretas",
      description: "Alertas de novas mensagens diretas"
    },
    {
      key: "follower_alerts",
      icon: UserPlus,
      label: "Novos Seguidores",
      description: "Quando alguém começar a te seguir"
    },
    {
      key: "post_likes_enabled",
      icon: Heart,
      label: "Curtidas em Posts",
      description: "Quando alguém curtir seus posts"
    },
    {
      key: "comments_enabled",
      icon: MessageCircle,
      label: "Comentários",
      description: "Quando alguém comentar seus posts"
    },
    {
      key: "mentions_enabled",
      icon: AtSign,
      label: "Menções",
      description: "Quando alguém mencionar você"
    },
    {
      key: "followed_posts_enabled",
      icon: Bell,
      label: "Posts de Seguidos",
      description: "Novos posts de usuários que você segue"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-400" />
            Notificações da Comunidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Notification Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Tipos de Notificações</h4>
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">{type.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[type.key]}
                    onCheckedChange={(checked) => setSettings({ ...settings, [type.key]: checked })}
                  />
                </div>
              );
            })}
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Frequência</h4>
            <Select
              value={settings.notification_frequency}
              onValueChange={(value) => setSettings({ ...settings, notification_frequency: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="tempo_real">Tempo Real</SelectItem>
                <SelectItem value="diario">Resumo Diário</SelectItem>
                <SelectItem value="semanal">Resumo Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Notificações por E-mail</h4>
            
            <div className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-sm text-white">Habilitar e-mails</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Receber notificações por e-mail
                </p>
              </div>
              <Switch
                checked={settings.email_notifications_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, email_notifications_enabled: checked })}
              />
            </div>

            {settings.email_notifications_enabled && (
              <div className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex-1">
                  <p className="font-medium text-sm text-white">Apenas críticos</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    E-mails apenas para mensagens e seguidores
                  </p>
                </div>
                <Switch
                  checked={settings.email_for_critical_only}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_for_critical_only: checked })}
                />
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex-1">
              <p className="font-medium text-sm text-white">Notificações Push</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Alertas em tempo real na tela
              </p>
            </div>
            <Switch
              checked={settings.push_notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, push_notifications_enabled: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}