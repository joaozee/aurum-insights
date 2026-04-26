import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    investment_style: "buy_hold",
    experience_level: "iniciante",
    is_portfolio_public: false,
    is_transactions_public: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const profileData = await base44.entities.UserProfile.filter({ 
        user_email: userData.email 
      });

      if (profileData.length > 0) {
        setProfile(profileData[0]);
        setFormData({
          bio: profileData[0].bio || "",
          investment_style: profileData[0].investment_style || "buy_hold",
          experience_level: profileData[0].experience_level || "iniciante",
          is_portfolio_public: profileData[0].is_portfolio_public || false,
          is_transactions_public: profileData[0].is_transactions_public || false
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          ...formData,
          user_name: user.full_name
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: user.email,
          user_name: user.full_name,
          joined_date: new Date().toISOString().split('T')[0],
          ...formData
        });
      }
      toast.success("Perfil atualizado com sucesso!");
      setTimeout(() => {
        window.location.href = createPageUrl("Profile");
      }, 1000);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-96 w-full bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <User className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Configurações do Perfil</h1>
              <p className="text-sm text-gray-400">Configure como outros usuários veem você</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Bio */}
            <div>
              <Label className="text-white mb-2 block">Biografia</Label>
              <Textarea
                placeholder="Conte um pouco sobre você e sua estratégia de investimento..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/300 caracteres</p>
            </div>

            {/* Investment Style */}
            <div>
              <Label className="text-white mb-2 block">Estilo de Investimento</Label>
              <Select value={formData.investment_style} onValueChange={(value) => setFormData({ ...formData, investment_style: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="buy_hold">Buy & Hold</SelectItem>
                  <SelectItem value="dividendos">Dividendos</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="value">Value Investing</SelectItem>
                  <SelectItem value="swing_trade">Swing Trade</SelectItem>
                  <SelectItem value="day_trade">Day Trade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level */}
            <div>
              <Label className="text-white mb-2 block">Nível de Experiência</Label>
              <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                  <SelectItem value="especialista">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Privacy Settings */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Privacidade</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <div>
                    <Label className="text-white text-base">Carteira Pública</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Outros usuários poderão ver seus ativos e performance
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_portfolio_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_portfolio_public: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <div>
                    <Label className="text-white text-base">Transações Públicas</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Mostre suas compras recentes (apenas se carteira pública)
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_transactions_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_transactions_public: checked })}
                    disabled={!formData.is_portfolio_public}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-800">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}