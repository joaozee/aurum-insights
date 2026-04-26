import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Play, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function FavoriteLessons() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const favoritesData = await base44.entities.FavoriteLesson.filter({
        user_email: userData.email
      }, "-created_date");

      setFavorites(favoritesData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    try {
      await base44.entities.FavoriteLesson.delete(favoriteId);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success("Removido dos favoritos");
    } catch (e) {
      console.log(e);
      toast.error("Erro ao remover favorito");
    }
  };

  // Group favorites by course
  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.course_id]) {
      acc[fav.course_id] = {
        course_title: fav.course_title,
        course_id: fav.course_id,
        lessons: []
      };
    }
    acc[fav.course_id].lessons.push(fav);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Skeleton className="h-10 w-64 mb-8 bg-gray-800" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Star className="h-8 w-8 text-amber-400 fill-current" />
          <h1 className="text-3xl font-bold text-white">Aulas Favoritas</h1>
        </div>

        {Object.keys(groupedFavorites).length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <Star className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhuma aula favorita ainda
            </h3>
            <p className="text-gray-400 mb-6">
              Marque suas aulas favoritas para encontrá-las facilmente aqui
            </p>
            <Link to={createPageUrl("MyCourses")}>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <BookOpen className="h-4 w-4 mr-2" />
                Ver Meus Cursos
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.values(groupedFavorites).map((group) => (
              <div key={group.course_id}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  {group.course_title}
                </h2>
                <div className="space-y-3">
                  {group.lessons.map((fav) => (
                    <Card key={fav.id} className="bg-gray-900 border-gray-800 hover:border-violet-500/50 transition-all">
                      <div className="flex items-center gap-4 p-4">
                        <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Play className="h-6 w-6 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white mb-1">
                            {fav.lesson_title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Módulo {fav.module_index + 1} • Aula {fav.lesson_index + 1}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={createPageUrl(`CoursePlayer?id=${fav.course_id}`)}>
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                              <Play className="h-4 w-4 mr-2" />
                              Assistir
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleRemove(fav.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}