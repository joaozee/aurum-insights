import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { cn } from "@/components/lib/utils";
import ReviewForm from "./ReviewForm";

export default function CourseReviews({ courseId, userEmail, userName, isAdmin }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState({});
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  const loadReviews = async () => {
    try {
      const allReviews = await base44.entities.CourseReview.filter({
        course_id: courseId
      });

      // Se é admin, mostra todas. Se não, mostra apenas aprovadas
      const filteredReviews = isAdmin 
        ? allReviews 
        : allReviews.filter(r => r.status === "approved");

      setReviews(filteredReviews);

      // Calcular média apenas de reviews aprovadas
      const approvedReviews = allReviews.filter(r => r.status === "approved");
      if (approvedReviews.length > 0) {
        const avg = approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }

      // Verificar se usuário já fez review
      const existingReview = allReviews.find(r => r.user_email === userEmail);
      setUserReview(existingReview);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    setApprovalLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      await base44.entities.CourseReview.update(reviewId, {
        status: "approved"
      });
      loadReviews();
    } catch (e) {
      console.log(e);
    } finally {
      setApprovalLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleReject = async (reviewId) => {
    setApprovalLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      await base44.entities.CourseReview.update(reviewId, {
        status: "rejected"
      });
      loadReviews();
    } catch (e) {
      console.log(e);
    } finally {
      setApprovalLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleReviewSubmitted = () => {
    loadReviews();
  };

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-600"
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">Avaliação dos alunos</p>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-white">{averageRating}</div>
              <div>
                {renderStars(Math.round(averageRating))}
                <p className="text-sm text-gray-400 mt-1">
                  {reviews.filter(r => r.status === "approved").length} avaliações
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating && r.status === "approved").length;
              const total = reviews.filter(r => r.status === "approved").length;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-8">{rating}★</span>
                  <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Review Form */}
      {userEmail && !userReview && (
        <ReviewForm
          courseId={courseId}
          userName={userName}
          userEmail={userEmail}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Comentários ({reviews.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 p-6 text-center">
            <p className="text-gray-400">Nenhuma avaliação ainda</p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card
              key={review.id}
              className={cn(
                "bg-gray-900 border-gray-800 p-6",
                review.status === "pending" && "border-amber-500/30"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-white">{review.user_name}</p>
                    {review.status === "pending" && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                        Pendente
                      </Badge>
                    )}
                    {review.status === "rejected" && (
                      <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                        Rejeitada
                      </Badge>
                    )}
                  </div>
                  <div className="mb-2">{renderStars(review.rating)}</div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {isAdmin && review.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-700 text-green-400 hover:bg-green-900/20"
                      onClick={() => handleApprove(review.id)}
                      disabled={approvalLoading[review.id]}
                    >
                      {approvalLoading[review.id] ? (
                        <Loader2 className="h-3 w-3" />
                      ) : (
                        "Aprovar"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                      onClick={() => handleReject(review.id)}
                      disabled={approvalLoading[review.id]}
                    >
                      {approvalLoading[review.id] ? (
                        <Loader2 className="h-3 w-3" />
                      ) : (
                        "Rejeitar"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-gray-300 text-sm mb-3">{review.comment}</p>

              {review.status === "approved" && (
                <div className="flex gap-4 pt-3 border-t border-gray-800">
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400 transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                    {review.helpful_count || 0}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
                    <ThumbsDown className="h-3 w-3" />
                    {review.unhelpful_count || 0}
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}