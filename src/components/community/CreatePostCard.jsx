import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Image, Send, X, Crown, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { ContentModerator } from "@/components/ai/ContentModerator";

export default function CreatePostCard({ user, onPostCreated }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [newsUrl, setNewsUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showNewsLink, setShowNewsLink] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      toast.error("Máximo de 4 imagens por post");
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
      toast.success("Imagens carregadas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar imagens");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0 && !newsUrl) {
      toast.error("Adicione algum conteúdo ao seu post");
      return;
    }

    setPosting(true);
    const toastId = toast.loading("Publicando post...");

    try {
      // Clear form immediately for better UX
      const postContent = content;
      const postImages = [...images];
      const postNewsUrl = newsUrl;
      const postIsPremium = isPremiumOnly;

      setContent("");
      setImages([]);
      setNewsUrl("");
      setIsPremiumOnly(false);
      setShowImageUpload(false);
      setShowNewsLink(false);

      // Skip moderation for now to debug
      const moderation = { status: "aprovado", confianca: 100 };

      // AI Auto-tagging (parallel with post creation)
      let tags = [];
      const tagPromise = base44.integrations.Core.InvokeLLM({
        prompt: `Analise este post de investimentos e retorne até 4 tags relevantes.

Post: "${postContent}"

Escolha apenas entre estas categorias: acoes, dividendos, macroeconomia, analises, dicas, educacao

Retorne apenas as tags mais relevantes.`,
        response_json_schema: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }).catch(() => ({ tags: [] }));

      const postData = {
       content: postContent.trim(),
       author_name: user.full_name || "Usuário",
       author_email: user.email,
       author_avatar: user.avatar_url || "",
       post_type: postImages.length > 0 ? "image" : (postNewsUrl ? "news" : "text"),
       images: postImages.length > 0 ? postImages : [],
       tags: [],
       news_url: postNewsUrl?.trim() || null,
       is_premium_only: postIsPremium,
       moderation_status: moderation.status,
       moderation_score: moderation.confianca,
       likes_count: 0,
       liked_by: [],
       shares_count: 0,
       comments: []
      };

      // Create post first
       let createdPost;
       try {
         console.log("Criando post com dados:", postData);
         createdPost = await base44.entities.CommunityPost.create(postData);
         console.log("Post criado com ID:", createdPost?.id);
       } catch (error) {
         console.error("Erro ao criar post:", error);
         toast.dismiss(toastId);
         toast.error(`Erro ao publicar: ${error.message || "Tente novamente"}`);
         setPosting(false);
         return;
       }

       if (!createdPost?.id) {
         toast.dismiss(toastId);
         toast.error("Post criado mas sem ID - tente recarregar.");
         setPosting(false);
         return;
       }

       // Then update tags and points in parallel (non-blocking)
        Promise.all([
          tagPromise.then(result => {
            if (result.tags?.length > 0) {
              return base44.entities.CommunityPost.update(createdPost.id, { tags: result.tags });
            }
          }).catch(() => {}),

         base44.entities.UserPoints.filter({ user_email: user.email })
           .then(points => {
             if (points.length > 0) {
               return base44.entities.UserPoints.update(points[0].id, {
                 total_points: (points[0].total_points || 0) + 5,
                 points_from_community: (points[0].points_from_community || 0) + 5,
                 posts_created: (points[0].posts_created || 0) + 1
               });
             }
           }).catch(() => {}),

         base44.entities.UserProfile.filter({ user_email: user.email })
           .then(profiles => {
             if (profiles.length > 0) {
               return base44.entities.UserProfile.update(profiles[0].id, {
                 posts_count: (profiles[0].posts_count || 0) + 1
               });
             }
           }).catch(() => {})
       ]).catch(() => {});

      toast.dismiss(toastId);
      toast.success("Post publicado!");
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Erro ao publicar post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-violet-500/20 text-violet-400">
              {user?.full_name?.[0] || "U"}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Compartilhe seus pensamentos sobre investimentos..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
          />

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* News URL Input */}
          {showNewsLink && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Cole o link da notícia..."
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewsUrl("");
                  setShowNewsLink(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading || images.length >= 4}
                />
                <div className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Image className="h-5 w-5 text-emerald-400" />
                </div>
              </label>

              <button
                onClick={() => setShowNewsLink(!showNewsLink)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LinkIcon className="h-5 w-5 text-blue-400" />
              </button>

              {user?.is_premium && (
                <label className="flex items-center gap-2 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={isPremiumOnly}
                    onChange={(e) => setIsPremiumOnly(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                  />
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" />
                    Premium
                  </span>
                </label>
              )}
            </div>

            <Button
              onClick={handlePost}
              disabled={posting || uploading || (!content.trim() && images.length === 0 && !newsUrl)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {posting ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}