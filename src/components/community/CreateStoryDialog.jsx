import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function CreateStoryDialog({ user, open, onClose, onCreated }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!image) {
      toast.error("Selecione uma imagem");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await base44.entities.Story.create({
        user_email: user.email,
        user_name: user.full_name,
        user_avatar: user.avatar_url,
        media_url: file_url,
        media_type: "image",
        caption: caption || null,
        expires_at: expiresAt.toISOString(),
        views_count: 0,
        viewed_by: []
      });

      toast.success("Story publicado!");
      setImage(null);
      setImagePreview(null);
      setCaption("");
      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao publicar story");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-96 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
              <Upload className="h-12 w-12 text-gray-600 mb-2" />
              <span className="text-gray-400 text-sm">Clique para selecionar uma imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          )}

          <Textarea
            placeholder="Adicione uma legenda..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />

          <Button
            onClick={handleCreate}
            disabled={!image || uploading}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {uploading ? "Publicando..." : "Publicar Story"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}