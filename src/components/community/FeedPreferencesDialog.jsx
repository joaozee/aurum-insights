import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function FeedPreferencesDialog({ open, onClose, userEmail, onSuccess }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const topicOptions = [
    { value: "acoes", label: "Ações", color: "bg-blue-500" },
    { value: "dividendos", label: "Dividendos", color: "bg-green-500" },
    { value: "macroeconomia", label: "Macroeconomia", color: "bg-purple-500" },
    { value: "analises", label: "Análises", color: "bg-amber-500" },
    { value: "dicas", label: "Dicas", color: "bg-pink-500" },
    { value: "educacao", label: "Educação", color: "bg-indigo-500" }
  ];

  const algorithmOptions = [
    { value: "chronological", label: "Mais Recentes", description: "Posts ordenados por data" },
    { value: "relevance", label: "Relevância", description: "IA prioriza conteúdo relevante" },
    { value: "engagement", label: "Engajamento", description: "Posts com mais interações" }
  ];

  useEffect(() => {
    if (open && userEmail) {
      loadPreferences();
    }
  }, [open, userEmail]);

  const loadPreferences = async () => {
    try {
      const prefs = await base44.entities.FeedPreferences.filter({
        user_email: userEmail
      });

      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        setPreferences({
          user_email: userEmail,
          interest_topics: ["acoes", "dividendos"],
          content_types: ["text", "image", "news", "article"],
          feed_algorithm: "relevance",
          followed_users: [],
          followed_groups: []
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar preferências");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic) => {
    const newTopics = preferences.interest_topics.includes(topic)
      ? preferences.interest_topics.filter(t => t !== topic)
      : [...preferences.interest_topics, topic];
    
    setPreferences({ ...preferences, interest_topics: newTopics });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (preferences.id) {
        await base44.entities.FeedPreferences.update(preferences.id, preferences);
      } else {
        await base44.entities.FeedPreferences.create(preferences);
      }
      toast.success("Preferências salvas!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Feed</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Topics of Interest */}
            <div>
              <Label className="text-base mb-3 block">Tópicos de Interesse</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Selecione os tópicos que mais te interessam
              </p>
              <div className="flex flex-wrap gap-2">
                {topicOptions.map((topic) => {
                  const isSelected = (preferences?.interest_topics || []).includes(topic.value);
                  return (
                    <button
                      key={topic.value}
                      onClick={() => toggleTopic(topic.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${topic.color} text-white border-transparent`
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-500"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4 inline mr-1" />}
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Algorithm */}
            <div>
              <Label className="text-base mb-3 block">Algoritmo do Feed</Label>
              <div className="space-y-2">
                {algorithmOptions.map((algo) => (
                  <button
                    key={algo.value}
                    onClick={() => setPreferences({ ...preferences, feed_algorithm: algo.value })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      preferences.feed_algorithm === algo.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{algo.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{algo.description}</p>
                      </div>
                      {preferences.feed_algorithm === algo.value && (
                        <Check className="h-5 w-5 text-violet-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
              <p className="text-sm text-violet-900 dark:text-violet-300">
                💡 <strong>Dica:</strong> Suas preferências ajudam a IA a sugerir conteúdo mais relevante para você. Você também pode seguir usuários específicos para ver seus posts no topo do feed.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Preferências"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}