import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, BookOpen, GraduationCap, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/lib/utils";

export default function ContentRecommendations({ userEmail, maxRecommendations = 6, displayMode = "grid" }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      generateRecommendations();
    }
  }, [userEmail]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const [
        userEnrollments,
        contentViews,
        userPoints,
        riskProfile,
        allCourses,
        allEducationContent,
        allContent
      ] = await Promise.all([
        base44.entities.UserEnrollment.filter({ user_email: userEmail }),
        base44.entities.ContentView.filter({ user_email: userEmail }, "-created_date", 50),
        base44.entities.UserPoints.filter({ user_email: userEmail }),
        base44.entities.RiskProfile.filter({ user_email: userEmail }),
        base44.entities.Course.list("-created_date", 50),
        base44.entities.EducationContent.list("-created_date", 50),
        base44.entities.Content.list("-created_date", 50)
      ]);

      // Get enrolled course IDs
      const enrolledCourseIds = userEnrollments.map(e => e.course_id);
      const viewedContentIds = contentViews.map(v => v.content_id);

      // Prepare user profile for AI
      const userProfile = {
        enrollments: userEnrollments,
        recentViews: contentViews.slice(0, 10),
        totalPoints: userPoints[0]?.total_points || 0,
        coursesCompleted: userPoints[0]?.courses_completed || 0,
        riskTolerance: riskProfile[0]?.risk_tolerance || "moderado",
        investmentHorizon: riskProfile[0]?.investment_horizon || "medio_prazo",
        marketKnowledge: riskProfile[0]?.market_knowledge || "iniciante"
      };

      // Get AI recommendations
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de recomendação de conteúdo educacional sobre investimentos.

Perfil do usuário:
- Nível de conhecimento: ${userProfile.marketKnowledge}
- Tolerância a risco: ${userProfile.riskTolerance}
- Horizonte de investimento: ${userProfile.investmentHorizon}
- Cursos completados: ${userProfile.coursesCompleted}
- Pontos totais: ${userProfile.totalPoints}

Cursos já matriculados: ${JSON.stringify(enrolledCourseIds)}
Conteúdos visualizados recentemente: ${JSON.stringify(userProfile.recentViews.map(v => ({ title: v.content_title, category: v.content_category })))}

Catálogo disponível:
Cursos: ${JSON.stringify(allCourses.map(c => ({ id: c.id, title: c.title, category: c.category, level: c.level, price: c.price })))}
Conteúdo educacional: ${JSON.stringify(allEducationContent.map(c => ({ id: c.id, title: c.title, type: c.type, category: c.category })))}
Artigos/Vídeos: ${JSON.stringify(allContent.map(c => ({ id: c.id, title: c.title, type: c.type, category: c.category })))}

Com base no perfil e histórico do usuário, recomende até ${maxRecommendations} conteúdos (cursos ou materiais educacionais) que sejam mais relevantes.
Priorize:
1. Conteúdos não visualizados ainda
2. Alinhamento com nível de conhecimento atual
3. Progressão natural de aprendizado
4. Diversidade de tipos de conteúdo

Para cada recomendação, explique brevemente (1 frase) por que é relevante para este usuário.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  content_id: { type: "string" },
                  content_type: { type: "string", enum: ["course", "education_content", "content"] },
                  reason: { type: "string" },
                  priority: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Map recommendations to full content objects
      const recommendedItems = aiResponse.recommendations
        .map(rec => {
          let item = null;
          if (rec.content_type === "course") {
            item = allCourses.find(c => c.id === rec.content_id);
            if (item) item._type = "course";
          } else if (rec.content_type === "education_content") {
            item = allEducationContent.find(c => c.id === rec.content_id);
            if (item) item._type = "education_content";
          } else if (rec.content_type === "content") {
            item = allContent.find(c => c.id === rec.content_id);
            if (item) item._type = "content";
          }
          
          if (item) {
            return { ...item, recommendation_reason: rec.reason, priority: rec.priority };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, maxRecommendations);

      setRecommendations(recommendedItems);
    } catch (e) {
      console.log("Error generating recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(
        displayMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
      )}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <Skeleton className="h-32 w-full bg-gray-800 mb-3" />
            <Skeleton className="h-6 w-3/4 bg-gray-800 mb-2" />
            <Skeleton className="h-4 w-full bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">Recomendado para você</h2>
      </div>

      <div className={cn(
        displayMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
      )}>
        {recommendations.map((item) => {
          const isCourse = item._type === "course";
          const isEducation = item._type === "education_content";
          const linkUrl = isCourse 
            ? `CourseDetail?id=${item.id}` 
            : `ContentDetail?id=${item.id}`;

          return (
            <Link key={item.id} to={createPageUrl(linkUrl)}>
              <div className="group relative bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 border border-gray-800 hover:border-violet-500/50 h-full flex flex-col">
                {/* AI Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 backdrop-blur-sm text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>

                {isCourse && (
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={item.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {item.level && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-gray-900/80 backdrop-blur-sm text-violet-300 border border-violet-500/30 text-xs">
                          {item.level}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    {!isCourse && (
                      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-violet-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.recommendation_reason && (
                        <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">
                          "{item.recommendation_reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {item.description || item.short_description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {item.duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration_hours}h
                      </span>
                    )}
                    {item.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.duration_minutes} min
                      </span>
                    )}
                    {item.students_count && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.students_count}
                      </span>
                    )}
                  </div>

                  {isCourse && (
                    <div className="mt-auto pt-3 border-t border-gray-800">
                      {item.price > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">
                            R$ {item.price?.toFixed(2)}
                          </span>
                          <Button size="sm" variant="ghost" className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
                            Ver curso →
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-0">Grátis</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}