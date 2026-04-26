import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Bell, TrendingUp, Target, AlertCircle, BarChart3, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function NotificationSettings({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    price_variation_threshold: 5,
    large_transaction_threshold: 1000,
    expense_analysis_enabled: true,
    goal_progress_alerts: true,
    portfolio_performance_alerts: true,
    price_alerts_enabled: true,
    benchmark_comparison_alerts: true,
    weekly_summary_enabled: true,
    notification_frequency: "diario",
    email_notifications_enabled: true,
    email_for_critical_only: false
  });

  useEffect(() => {
    if (open && userEmail) {
      loadSettings();
    }
  }, [open, userEmail]);

  const loadSettings = async () => {
    try {
      const data = await base44.entities.AlertSettings.filter({ user_email: userEmail });
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
      const existing = await base44.entities.AlertSettings.filter({ user_email: userEmail });
      
      if (existing.length > 0) {
        await base44.entities.AlertSettings.update(existing[0].id, settings);
      } else {
        await base44.entities.AlertSettings.create({
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

  const notificationCategories = {
    market: [
      {
        key: "price_alerts_enabled",
        icon: AlertCircle,
        label: "Alertas de Preço",
        description: "Notificações de preços-alvo personalizados"
      },
      {
        key: "portfolio_performance_alerts",
        icon: TrendingUp,
        label: "Performance da Carteira",
        description: "Alertas de ganhos ou perdas significativas"
      },
      {
        key: "benchmark_comparison_alerts",
        icon: BarChart3,
        label: "Comparação com Benchmarks",
        description: "Quando sua carteira supera ou fica abaixo do mercado"
      },
      {
        key: "stock_analysis_alerts",
        icon: TrendingUp,
        label: "Análises de Ações",
        description: "Novas análises de ações no seu portfólio"
      },
      {
        key: "dividend_alerts",
        icon: TrendingUp,
        label: "Anúncios de Dividendos",
        description: "Quando ações que você possui anunciarem dividendos"
      }
    ],
    macro: [
      {
        key: "macro_selic_alerts",
        icon: TrendingUp,
        label: "Alertas SELIC",
        description: "Mudanças na taxa SELIC"
      },
      {
        key: "macro_ipca_alerts",
        icon: TrendingUp,
        label: "Alertas IPCA",
        description: "Variações do IPCA"
      },
      {
        key: "macro_dolar_alerts",
        icon: TrendingUp,
        label: "Alertas Dólar",
        description: "Variações do dólar"
      }
    ],
    goals: [
      {
        key: "goal_progress_alerts",
        icon: Target,
        label: "Progresso de Metas",
        description: "Alertas quando atingir marcos importantes"
      }
    ],
    learning: [
      {
        key: "course_reminder_alerts",
        icon: Bell,
        label: "Lembretes de Cursos",
        description: "Lembrete quando não acessar cursos por 7 dias"
      },
      {
        key: "new_content_alerts",
        icon: TrendingUp,
        label: "Novos Conteúdos",
        description: "Alertas sobre novos conteúdos do seu interesse"
      }
    ],
    community: [
      {
        key: "community_reply_alerts",
        icon: Bell,
        label: "Respostas aos Seus Posts",
        description: "Quando alguém responder suas publicações"
      },
      {
        key: "community_mention_alerts",
        icon: Bell,
        label: "Menções",
        description: "Quando alguém mencionar você"
      },
      {
        key: "community_post_alerts",
        icon: Bell,
        label: "Novos Posts",
        description: "Novos posts de usuários que você segue"
      },
      {
        key: "community_like_alerts",
        icon: Bell,
        label: "Curtidas",
        description: "Quando alguém curtir seus posts"
      }
    ],
    achievements: [
      {
        key: "achievement_alerts",
        icon: Target,
        label: "Badges e Conquistas",
        description: "Quando desbloquear novas conquistas"
      },
      {
        key: "mentorship_alerts",
        icon: Bell,
        label: "Mentoria e Eventos",
        description: "Notificações de sessões de mentoria e eventos ao vivo"
      }
    ],
    other: [
      {
        key: "expense_analysis_enabled",
        icon: Bell,
        label: "Análise de Gastos IA",
        description: "Insights automáticos sobre seus gastos"
      },
      {
        key: "weekly_summary_enabled",
        icon: Clock,
        label: "Resumo Semanal",
        description: "Resumo completo da semana"
      }
    ]
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-400" />
            Configurações de Notificações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Market Alerts */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              Alertas de Mercado
            </h4>
            {notificationCategories.market.map((type) => {
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

          {/* Macro Indicators */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-400" />
              Indicadores Macroeconômicos
            </h4>
            {notificationCategories.macro.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-amber-400" />
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

          {/* Goals */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Metas e Objetivos
            </h4>
            {notificationCategories.goals.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-emerald-400" />
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

          {/* Learning */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" />
              Aprendizado
            </h4>
            {notificationCategories.learning.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-blue-400" />
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

          {/* Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
              Comunidade
            </h4>
            {notificationCategories.community.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-cyan-400" />
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

          {/* Achievements */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              Conquistas e Mentoria
            </h4>
            {notificationCategories.achievements.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-purple-400" />
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

          {/* Other */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Outros</h4>
            {notificationCategories.other.map((type) => {
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

          {/* Thresholds */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Limites de Alerta</h4>
            
            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <Label className="text-sm text-gray-300">
                Variação de preço significativa (%)
              </Label>
              <Input
                type="number"
                value={settings.price_variation_threshold}
                onChange={(e) => setSettings({ ...settings, price_variation_threshold: parseFloat(e.target.value) || 5 })}
                className="bg-gray-800 border-gray-700"
                min="1"
                max="50"
                step="0.5"
              />
              <p className="text-xs text-gray-400">
                Alertar quando um ativo variar mais que este percentual
              </p>
            </div>

            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <Label className="text-sm text-gray-300">
                Transação grande (R$)
              </Label>
              <Input
                type="number"
                value={settings.large_transaction_threshold}
                onChange={(e) => setSettings({ ...settings, large_transaction_threshold: parseFloat(e.target.value) || 1000 })}
                className="bg-gray-800 border-gray-700"
                min="100"
                step="100"
              />
              <p className="text-xs text-gray-400">
                Alertar sobre transações acima deste valor
              </p>
            </div>
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
            <p className="text-xs text-gray-400">
              Com que frequência deseja receber notificações
            </p>
          </div>

          {/* Email Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Notificações por E-mail</h4>
            
            <div className="flex items-start justify-between gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-sm text-white">Habilitar e-mails</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Receber notificações importantes por e-mail
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
                  <p className="font-medium text-sm text-white">Apenas notificações críticas</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Receber e-mails somente para alertas de erro ou aviso
                  </p>
                </div>
                <Switch
                  checked={settings.email_for_critical_only}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_for_critical_only: checked })}
                />
              </div>
            )}
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