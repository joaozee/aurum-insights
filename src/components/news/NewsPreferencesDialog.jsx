import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings2, Plus, X, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AVAILABLE_TOPICS = [
  { value: "acoes", label: "Ações" },
  { value: "fiis", label: "FIIs" },
  { value: "commodities", label: "Commodities" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "macroeconomia", label: "Macroeconomia" },
  { value: "criptomoedas", label: "Criptomoedas" },
  { value: "renda_fixa", label: "Renda Fixa" },
  { value: "internacional", label: "Internacional" },
  { value: "dividendos", label: "Dividendos" },
  { value: "ipos", label: "IPOs" }
];

const DEFAULT_SOURCES = [
  "InfoMoney",
  "Valor Econômico",
  "Bloomberg",
  "Reuters",
  "Estadão",
  "Folha",
  "CNN Brasil",
  "G1 Economia"
];

export default function NewsPreferencesDialog({ userEmail, preferences, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    followed_tickers: [],
    topics_of_interest: ["acoes", "macroeconomia"],
    trusted_sources: ["InfoMoney", "Valor Econômico", "Bloomberg", "Reuters"],
    notification_enabled: true,
    auto_follow_portfolio: true
  });
  const [newTicker, setNewTicker] = useState("");
  const [newSource, setNewSource] = useState("");

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (preferences?.id) {
        await base44.entities.NewsPreferences.update(preferences.id, settings);
      } else {
        await base44.entities.NewsPreferences.create({
          ...settings,
          user_email: userEmail
        });
      }
      
      toast.success("Preferências salvas!");
      setOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar preferências");
    } finally {
      setLoading(false);
    }
  };

  const addTicker = () => {
    if (!newTicker) return;
    const ticker = newTicker.toUpperCase();
    if (!settings.followed_tickers.includes(ticker)) {
      setSettings({
        ...settings,
        followed_tickers: [...settings.followed_tickers, ticker]
      });
    }
    setNewTicker("");
  };

  const removeTicker = (ticker) => {
    setSettings({
      ...settings,
      followed_tickers: settings.followed_tickers.filter(t => t !== ticker)
    });
  };

  const toggleTopic = (topic) => {
    const topics = settings.topics_of_interest || [];
    setSettings({
      ...settings,
      topics_of_interest: topics.includes(topic)
        ? topics.filter(t => t !== topic)
        : [...topics, topic]
    });
  };

  const toggleSource = (source) => {
    const sources = settings.trusted_sources || [];
    setSettings({
      ...settings,
      trusted_sources: sources.includes(source)
        ? sources.filter(s => s !== source)
        : [...sources, source]
    });
  };

  const addCustomSource = () => {
    if (!newSource) return;
    if (!settings.trusted_sources.includes(newSource)) {
      setSettings({
        ...settings,
        trusted_sources: [...settings.trusted_sources, newSource]
      });
    }
    setNewSource("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
          <Settings2 className="h-4 w-4 mr-2" />
          Preferências
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Preferências de Notícias
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Auto Follow Portfolio */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <p className="font-medium text-sm text-white">Seguir Ativos do Portfólio</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Automaticamente seguir notícias dos ativos que você possui
              </p>
            </div>
            <Switch
              checked={settings.auto_follow_portfolio}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, auto_follow_portfolio: checked })
              }
            />
          </div>

          {/* Followed Tickers */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-white">Tickers Seguidos</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: PETR4, VALE3..."
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTicker()}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button onClick={addTicker} size="icon" className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {settings.followed_tickers?.map(ticker => (
                <Badge
                  key={ticker}
                  className="bg-violet-500/20 text-violet-400 border border-violet-500/50 px-3 py-1 cursor-pointer hover:bg-violet-500/30"
                  onClick={() => removeTicker(ticker)}
                >
                  {ticker}
                  <X className="h-3 w-3 ml-1.5" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Topics of Interest */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-white">Tópicos de Interesse</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOPICS.map(topic => (
                <button
                  key={topic.value}
                  onClick={() => toggleTopic(topic.value)}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                    settings.topics_of_interest?.includes(topic.value)
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                      : "bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trusted Sources */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-white">Fontes Confiáveis</Label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_SOURCES.map(source => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                    settings.trusted_sources?.includes(source)
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  {source}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Adicionar fonte personalizada..."
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomSource()}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button onClick={addCustomSource} size="icon" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom Sources */}
            {settings.trusted_sources?.filter(s => !DEFAULT_SOURCES.includes(s)).length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
                {settings.trusted_sources.filter(s => !DEFAULT_SOURCES.includes(s)).map(source => (
                  <Badge
                    key={source}
                    className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 cursor-pointer hover:bg-emerald-500/30"
                    onClick={() => toggleSource(source)}
                  >
                    {source}
                    <X className="h-3 w-3 ml-1.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <p className="font-medium text-sm text-white">Notificações de Notícias</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Receber alertas sobre notícias importantes
              </p>
            </div>
            <Switch
              checked={settings.notification_enabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, notification_enabled: checked })
              }
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
              {loading ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}