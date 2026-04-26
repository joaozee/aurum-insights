import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CommentDialog({ open, onClose, post, user, onCommentAdded }) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      toast.error("Digite um comentário");
      return;
    }

    try {
      setLoading(true);

      const newComment = {
        author_name: user.full_name,
        author_email: user.email,
        author_avatar: user.avatar_url,
        content: comment,
        created_at: new Date().toISOString()
      };

      const updatedComments = [...(post.comments || []), newComment];

      await base44.entities.CommunityPost.update(post.id, {
        comments: updatedComments
      });

      // Create notification for post author
      if (post.author_email !== user.email) {
        await base44.entities.Notification.create({
          user_email: post.author_email,
          type: "comentario_post",
          title: `${user.full_name} comentou seu post`,
          message: comment.substring(0, 100),
          severity: "info",
          from_user_email: user.email,
          from_user_name: user.full_name,
          related_entity_id: post.id,
          is_sent: false
        }).catch(() => {});
      }

      toast.success("Comentário adicionado!");
      setComment("");
      onClose();
      onCommentAdded?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle>Adicionar Comentário</DialogTitle>
        </DialogHeader>

        {/* Post Preview */}
        <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-300">{post.content}</p>
        </div>

        {/* Comment Input */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} />
              ) : (
                <AvatarFallback className="bg-violet-500/20 text-violet-400">
                  {user?.full_name?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <Textarea
              placeholder="Escreva seu comentário..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-gray-800 border-gray-700 resize-none min-h-24"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitComment}
            disabled={loading || !comment.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? "Adicionando..." : "Comentar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}