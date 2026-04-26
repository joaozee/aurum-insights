import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "renda_fixa", label: "Renda Fixa", color: "bg-blue-500/10 text-blue-400" },
  { id: "acoes", label: "Ações", color: "bg-green-500/10 text-green-400" },
  { id: "analise_tecnica", label: "Análise Técnica", color: "bg-purple-500/10 text-purple-400" },
  { id: "criptomoedas", label: "Criptomoedas", color: "bg-orange-500/10 text-orange-400" },
  { id: "educacao", label: "Educação Financeira", color: "bg-indigo-500/10 text-indigo-400" },
  { id: "fiis", label: "FIIs", color: "bg-cyan-500/10 text-cyan-400" },
];

export default function CommunityGroups({ userEmail, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "renda_fixa",
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await base44.entities.CommunityGroup.list("-created_date", 50);
      setGroups(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await base44.entities.CommunityGroup.create({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        creator_email: userEmail,
        members: [userEmail],
        members_count: 1,
        posts_count: 0,
        is_public: true,
      });

      toast.success("Grupo criado com sucesso!");
      setFormData({ name: "", description: "", category: "renda_fixa" });
      setOpenDialog(false);
      loadGroups();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar grupo");
    }
  };

  const getCategoryColor = (categoryId) => {
    return CATEGORIES.find((c) => c.id === categoryId)?.color || "bg-gray-500/10 text-gray-400";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-gray-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Grupos Temáticos</h3>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-violet-500 hover:bg-violet-600 gap-2">
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Nome do Grupo</label>
                <Input
                  placeholder="Ex: Investimento em Ações Blue Chips"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Descreva o propósito do grupo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full bg-violet-500 hover:bg-violet-600">
                Criar Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 border-gray-800 p-5 hover:border-violet-500/30 transition-all cursor-pointer"
            onClick={() => onSelectGroup(group.id, group.name)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-violet-400" />
                  <h4 className="font-semibold text-white">{group.name}</h4>
                </div>
                <p className="text-sm text-gray-400">{group.description}</p>
              </div>
              <Badge className={getCategoryColor(group.category)}>
                {CATEGORIES.find((c) => c.id === group.category)?.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.members_count || 0} membros
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {group.posts_count || 0} posts
                </span>
              </div>
              <Button
                variant="ghost"
                className="text-violet-400 hover:text-violet-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGroup(group.id, group.name);
                }}
              >
                Acessar →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Nenhum grupo criado ainda</p>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-violet-500 hover:bg-violet-600">Criar Primeiro Grupo</Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      )}
    </div>
  );
}