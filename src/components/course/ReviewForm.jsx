import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Send, AlertCircle } from "lucide-react";
import { cn } from "@/components/lib/utils";

export default function ReviewForm({ courseId, userName, userEmail, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Por favor, selecione uma avaliação");
      return;
    }

    if (comment.trim().length < 10) {
      setError("O comentário deve ter pelo menos 10 caracteres");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const review = await base44.entities.CourseReview.create({
        course_id: courseId,
        user_email: userEmail,
        user_name: userName,
        rating,
        comment,
        status: "pending"
      });

      setSubmitted(true);
      setRating(0);
      setComment("");
      
      if (onReviewSubmitted) {
        onReviewSubmitted(review);
      }

      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError("Erro ao enviar avaliação. Tente novamente.");
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-900/50 border-gray-800 p-8 shadow-xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          Deixe sua avaliação
        </h3>
        <p className="text-gray-400 text-sm">Compartilhe sua opinião e ajude outros alunos</p>
      </div>

      {submitted && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            ✓
          </div>
          <span>Avaliação enviada com sucesso! Aguardando moderação.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <label className="text-sm font-medium text-gray-300 block mb-4">Como você avalia este curso?</label>
          <div className="flex gap-3 justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all duration-200 hover:scale-125 focus:outline-none focus:scale-125"
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-all duration-200",
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                      : "text-gray-600 hover:text-gray-500"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30">
                <span className="text-lg">
                  {rating === 1 && "😞"}
                  {rating === 2 && "😕"}
                  {rating === 3 && "😐"}
                  {rating === 4 && "😊"}
                  {rating === 5 && "🤩"}
                </span>
                <span className="text-sm font-medium text-violet-400">
                  {rating === 1 && "Muito ruim"}
                  {rating === 2 && "Ruim"}
                  {rating === 3 && "Normal"}
                  {rating === 4 && "Bom"}
                  {rating === 5 && "Excelente"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comment */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <label className="text-sm font-medium text-gray-300 block mb-3">Conte sua experiência</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que você achou do curso? O que aprendeu? Recomendaria para outros?"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none text-sm h-32 resize-none transition-all"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Mínimo 10 caracteres
            </p>
            <p className={cn(
              "text-xs font-medium",
              comment.length >= 500 ? "text-amber-400" : "text-gray-500"
            )}>
              {comment.length}/500
            </p>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send className="h-5 w-5 mr-2" />
          {submitting ? "Enviando..." : "Enviar Avaliação"}
        </Button>
      </form>
    </Card>
  );
}