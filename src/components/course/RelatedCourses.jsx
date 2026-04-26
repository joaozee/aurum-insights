import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Users, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RelatedCourses({ currentCourse, courseType = "paid" }) {
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelated();
  }, [currentCourse?.id]);

  const loadRelated = async () => {
    try {
      const allCourses = await base44.entities.Course.list("-created_date");
      
      const filtered = allCourses
        .filter(c => c.id !== currentCourse?.id)
        .filter(c => {
          if (courseType === "paid") return c.price > 0;
          if (courseType === "free") return c.price === 0;
          return true;
        })
        .filter(c => 
          c.category === currentCourse?.category ||
          c.level === currentCourse?.level
        )
        .sort((a, b) => {
          if (a.category === currentCourse?.category && b.category !== currentCourse?.category) return -1;
          if (a.level === currentCourse?.level && b.level !== currentCourse?.level) return -1;
          return 0;
        })
        .slice(0, 4);

      setRelatedCourses(filtered);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <div className="flex gap-4 p-4">
              <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0 bg-gray-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 bg-gray-800" />
                <Skeleton className="h-4 w-1/2 bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (relatedCourses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-violet-400" />
        Próximos Passos
      </h3>
      {relatedCourses.map((course) => {
        const discountPercent = course.original_price && course.original_price > course.price 
          ? Math.round((1 - course.price / course.original_price) * 100)
          : null;

        return (
          <Link key={course.id} to={createPageUrl(`CourseDetail?id=${course.id}`)}>
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden hover:border-violet-500/50 transition-all duration-300 group">
              <div className="flex gap-4 p-4">
                <div className="relative h-24 w-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {discountPercent && (
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-emerald-500/90 text-white border-0 text-xs">
                        {discountPercent}%
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-2 mb-1">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">
                        {levelLabels[course.level] || "Iniciante"}
                      </Badge>
                      {course.duration_hours && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {course.duration_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {course.price > 0 && (
                      <span className="text-sm font-semibold text-white">
                        R$ {course.price?.toFixed(2)}
                      </span>
                    )}
                    {course.price === 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                        Grátis
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}