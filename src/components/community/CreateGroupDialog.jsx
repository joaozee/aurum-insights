import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateGroupDialog({ open, onClose, onSuccess, userEmail }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [creating, setCreating] = useState(false);

  const colors = [
    { value: "blue", label: "Azul", class: "bg-blue-500" },
    { value: "purple", label: "Roxo", class: "bg-purple-500" },
    { value: "emerald", label: "Verde", class: "bg-emerald-500" },
    { value: "amber", label: "Amarelo", class: "bg-amber-500" },
    { value: "red", label: "Vermelho", class: "bg-red-500" },
    { value: "pink", label: "Rosa", class: "bg-pink-500" }
  ];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    setCreating(true);
    try {
      // Create group
      const group = await base44.entities.CommunityGroup.create({
        name: name.trim(),
        description: description.trim(),
        icon: "Users",
        color: selectedColor,
        member_count: 1,
        posts_count: 0,
        is_premium_only: false
      });

      // Add creator as admin member
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: userEmail,
        user_name: userEmail.split('@')[0],
        role: "admin",
        joined_at: new Date().toISOString()
      });

      toast.success("Grupo criado com sucesso!");
      setName("");
      setDescription("");
      setSelectedColor("blue");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Criar Novo Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Nome do Grupo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Investidores de Dividendos"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-white">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito do grupo..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-white mb-2 block">Cor do Grupo</Label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-10 w-10 rounded-full ${color.class} ${
                    selectedColor === color.value ? "ring-2 ring-offset-2 ring-violet-500" : ""
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              disabled={creating || !name.trim()}
            >
              {creating ? "Criando..." : "Criar Grupo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}