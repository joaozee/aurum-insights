import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageCropperDialog, { getCroppedImage } from "./ImageCropperDialog";

export default function EditProfileDialog({ open, onClose, profile, onSuccess }) {
  const [formData, setFormData] = useState({
    bio: profile?.bio || "",
    twitter: profile?.social_links?.twitter || "",
    linkedin: profile?.social_links?.linkedin || "",
    instagram: profile?.social_links?.instagram || "",
    website: profile?.social_links?.website || ""
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperType, setCropperType] = useState(null);
  const [cropperAspect, setCropperAspect] = useState(1);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result);
      setCropperType("avatar");
      setCropperAspect(1);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result);
      setCropperType("cover");
      setCropperAspect(16 / 9);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result);
      setCropperType("banner");
      setCropperAspect(4 / 1);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (imageUrl, croppedAreaPixels) => {
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImage(imageUrl, croppedAreaPixels);
      
      // Criar um File a partir do Blob
      const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: file
      });

      const updateData = {
        avatar: { avatar_url: file_url },
        cover: { cover_image_url: file_url },
        banner: { banner_url: file_url }
      }[cropperType];

      await base44.entities.UserProfile.update(profile.id, updateData);
      
      const titles = {
        avatar: "Avatar",
        cover: "Foto de capa",
        banner: "Banner"
      };
      
      toast.success(`${titles[cropperType]} atualizado!`);
      
      // Atualizar estado local imediatamente
      const updatedProfile = { ...profile, ...updateData };
      onSuccess?.(updatedProfile);
    } catch (error) {
      console.error("Erro ao fazer crop:", error);
      toast.error("Erro ao processar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        bio: formData.bio,
        social_links: {
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          instagram: formData.instagram,
          website: formData.website
        }
      });
      toast.success("Perfil atualizado!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cover Image */}
          <div>
            <Label>Foto de Capa</Label>
            <div className="mt-2 relative h-32 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg overflow-hidden">
              {profile?.cover_image_url && (
                <img 
                  src={profile.cover_image_url} 
                  alt="Capa" 
                  className="w-full h-full object-cover"
                />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Alterar Capa
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Banner */}
          <div>
            <Label>Banner Personalizado</Label>
            <div className="mt-2 relative h-24 bg-gray-700 rounded-lg overflow-hidden">
              {profile?.banner_url && (
                <img 
                  src={profile.banner_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Alterar Banner
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Avatar */}
          <div>
            <Label>Foto de Perfil</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.user_name?.[0] || "U"
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              placeholder="Conte um pouco sobre você e seu estilo de investimento..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Redes Sociais</Label>
            
            <div>
              <Label htmlFor="twitter" className="text-sm text-gray-600">Twitter/X</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/seu_usuario"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-sm text-gray-600">LinkedIn</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/seu_usuario"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="instagram" className="text-sm text-gray-600">Instagram</Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/seu_usuario"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-sm text-gray-600">Website</Label>
              <Input
                id="website"
                placeholder="https://seu-site.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </DialogContent>

      {cropperImage && (
        <ImageCropperDialog
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setCropperImage(null);
          }}
          onCropComplete={handleCropComplete}
          imageUrl={cropperImage}
          aspect={cropperAspect}
          saving={uploading}
          title={{
            avatar: "Posicionar Foto de Perfil",
            cover: "Posicionar Foto de Capa",
            banner: "Posicionar Banner"
          }[cropperType]}
        />
      )}
    </Dialog>
  );
}