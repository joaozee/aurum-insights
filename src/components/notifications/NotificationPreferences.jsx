import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bell, Save } from "lucide-react";
import { toast } from "sonner";

const NOTIFICATION_OPTIONS = [
  {
    category: "Comunidade",
    notifications: [
      { key: "new_answers", label: "Novas respostas nas minhas perguntas", description: "Notificado quando alguém responde uma pergunta minha" },
      { key: "mentions", label: "Menções diretas", description: "Quando alguém me menciona em um post ou comentário" },
      { key: "post_comments", label: "Comentários nos meus posts", description: "Quando alguém comenta em um dos meus posts" },
      { key: "discussion_replies", label: "Respostas em discussões", description: "Quando há novas respostas em discussões que participo" }
    ]
  },
  {
    category: "Eventos",
    notifications: [
      { key: "new_events", label: "Novos eventos", description: "Quando um novo evento é criado em minhas categorias de interesse" },
      { key: "event_updates", label: "Atualizações de eventos", description: "Mudanças em eventos já registrados" },
      { key: "event_reminders", label: "Lembretes de eventos", description: "Lembretes antes do evento começar" }
    ]
  },
  {
    category: "Mentoria",
    notifications: [
      { key: "mentorship_request", label: "Pedidos de mentoria", description: "Quando alguém solicita ser seu mentorado" },
      { key: "mentorship_messages", label: "Mensagens de mentor", description: "Mensagens do seu mentor ou mentorados" },
      { key: "mentorship_milestones", label: "Marcos de mentoria", description: "Quando você ou seu mentorado atinge um marco" }
    ]
  },
  {
    category: "Portfólio",
    notifications: [
      { key: "portfolio_alerts", label: "Alertas de portfólio", description: "Variações significativas no portfólio" },
      { key: "insights", label: "Novos insights preditivos", description: "Quando há novos insights sobre meu portfólio" },
      { key: "benchmark_updates", label: "Atualizações de benchmark", description: "Quando há atualizações na comparação com benchmarks" }
    ]
  }
];

export default function NotificationPreferences({ userEmail }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState("diario");
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userEmail]);

  const loadPreferences = async () => {
    try {
      // Buscar preferências existentes ou criar padrão
      const existingPrefs = await base44.entities.AlertSettings.filter(
        { user_email: userEmail }
      );

      if (existingPrefs.length > 0) {
        setPreferences(existingPrefs[0]);
        setFrequency(existingPrefs[0].notification_frequency || "diario");
      } else {
        // Criar preferências padrão
        const defaultPrefs = {
          user_email: userEmail,
          // Comunidade
          new_answers: true,
          mentions: true,
          post_comments: true,
          discussion_replies: true,
          // Eventos
          new_events: true,
          event_updates: true,
          event_reminders: true,
          // Mentoria
          mentorship_request: true,
          mentorship_messages: true,
          mentorship_milestones: true,
          // Portfólio
          portfolio_alerts: true,
          insights: true,
          benchmark_updates: true,
          // Geral
          notification_frequency: "diario",
          push_notifications_enabled: false
        };

        const created = await base44.entities.AlertSettings.create(defaultPrefs);
        setPreferences(created);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await base44.entities.AlertSettings.update(preferences.id, {
        ...preferences,
        notification_frequency: frequency,
        push_notifications_enabled: pushEnabled
      });

      toast.success("Preferências de notificação salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            Notificações Push do Navegador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <p className="text-white font-semibold text-sm">Ativar Notificações Push</p>
              <p className="text-gray-400 text-xs mt-1">Receba alertas em tempo real no seu navegador</p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequency */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Frequência de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="tempo_real">Tempo Real</SelectItem>
              <SelectItem value="diario">Uma vez ao dia</SelectItem>
              <SelectItem value="semanal">Uma vez por semana</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-gray-400 text-xs mt-2">
            {frequency === "tempo_real" && "Você receberá notificações imediatamente quando ocorrerem"}
            {frequency === "diario" && "Você receberá um resumo diário das suas notificações"}
            {frequency === "semanal" && "Você receberá um resumo semanal das suas notificações"}
          </p>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      {NOTIFICATION_OPTIONS.map((category) => (
        <Card key={category.category} className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">{category.category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {category.notifications.map((notif) => (
              <div
                key={notif.key}
                className="flex items-start justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{notif.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{notif.description}</p>
                </div>
                <Switch
                  checked={preferences?.[notif.key] || false}
                  onCheckedChange={() => handleToggle(notif.key)}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <Button
        onClick={savePreferences}
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </>
        )}
      </Button>
    </div>
  );
}