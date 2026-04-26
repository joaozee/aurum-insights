import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FolderPlus, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PostCollectionsManager({ userEmail }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#8B5CF6" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userEmail) loadCollections();
  }, [userEmail]);

  const loadCollections = async () => {
    try {
      const data = await base44.entities.PostCollection.filter({
        user_email: userEmail
      });
      setCollections(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da coleção é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.PostCollection.update(editingId, formData);
        toast.success("Coleção atualizada!");
      } else {
        await base44.entities.PostCollection.create({
          user_email: userEmail,
          ...formData,
          post_ids: []
        });
        toast.success("Coleção criada!");
      }
      await loadCollections();
      setDialogOpen(false);
      setFormData({ name: "", description: "", color: "#8B5CF6" });
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar coleção");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.PostCollection.delete(id);
      toast.success("Coleção removida!");
      await loadCollections();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover coleção");
    }
  };

  const handleEdit = (collection) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      color: collection.color || "#8B5CF6"
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-violet-400" />
              Minhas Coleções
            </h3>
            <p className="text-sm text-gray-400 mt-1">Organize seus posts em coleções temáticas</p>
          </div>
          <Button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", description: "", color: "#8B5CF6" });
              setDialogOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Nova Coleção
          </Button>
        </div>

        {collections.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhuma coleção criada ainda</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection) => (
              <div 
                key={collection.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: collection.color }}
                  />
                  <div>
                    <h4 className="font-medium text-white">{collection.name}</h4>
                    {collection.description && (
                      <p className="text-sm text-gray-400 mt-1">{collection.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {collection.post_ids?.length || 0} post{collection.post_ids?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-violet-400"
                    onClick={() => handleEdit(collection)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                    onClick={() => handleDelete(collection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Coleção" : "Nova Coleção"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Análises Fundamentais"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da coleção (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400 ml-auto">{formData.color}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}