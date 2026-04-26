import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  GraduationCap, 
  Clock, 
  Users, 
  Star,
  Play,
  ArrowRight,
  BookOpen,
  Trophy,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import CourseFilters from "@/components/course/CourseFilters";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [educationContent, setEducationContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    category: "all",
    level: "all",
    duration: "all",
    price: "all",
    certificate: "all",
    difficulty: "all"
  });
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      await loadCourses();
    } catch (e) {
      console.log(e);
      await loadCourses();
    }
  };

  const loadCourses = async () => {
    try {
      const [coursesData, contentData] = await Promise.all([
        base44.entities.Course.list("-created_date"),
        base44.entities.EducationContent.list("-created_date")
      ]);
      setCourses(coursesData);
      setEducationContent(contentData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const applyCourseFilters = (course) => {
    // Category filters
    if (filter !== "all" && course.category !== filter) return false;
    if (advancedFilters.category !== "all" && course.category !== advancedFilters.category) return false;
    
    // Level/Difficulty filter
    if (advancedFilters.level !== "all" && course.level !== advancedFilters.level) return false;
    if (advancedFilters.difficulty !== "all" && course.level !== advancedFilters.difficulty) return false;
    
    // Price filter
    if (advancedFilters.price !== "all") {
      if (advancedFilters.price === "free" && course.price > 0) return false;
      if (advancedFilters.price === "paid" && course.price === 0) return false;
    }
    
    // Duration filter
    if (advancedFilters.duration !== "all" && course.duration_hours) {
      const ranges = {
        "Até 5h": { min: 0, max: 5 },
        "5h - 10h": { min: 5, max: 10 },
        "10h - 20h": { min: 10, max: 20 },
        "20h+": { min: 20, max: Infinity }
      };
      const range = ranges[advancedFilters.duration];
      if (range && (course.duration_hours < range.min || course.duration_hours > range.max)) return false;
    }
    
    // Certificate filter
    if (advancedFilters.certificate !== "all") {
      const hasCertificate = course.has_certificate !== false; // Default to true if not specified
      if (advancedFilters.certificate === "yes" && !hasCertificate) return false;
      if (advancedFilters.certificate === "no" && hasCertificate) return false;
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const titleMatch = course.title?.toLowerCase().includes(search);
      const descriptionMatch = course.description?.toLowerCase().includes(search);
      
      // Search in modules and lessons
      let moduleMatch = false;
      if (course.modules && Array.isArray(course.modules)) {
        moduleMatch = course.modules.some(module => {
          const moduleTitleMatch = module.title?.toLowerCase().includes(search);
          const lessonMatch = module.lessons?.some(lesson => 
            lesson.title?.toLowerCase().includes(search)
          );
          return moduleTitleMatch || lessonMatch;
        });
      }
      
      if (!titleMatch && !descriptionMatch && !moduleMatch) return false;
    }
    
    return true;
  };

  const categoryLabels = {
    investimentos: "Investimentos",
    formacao: "Formação",
    avancado: "Avançado"
  };

  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  const levelColors = {
    iniciante: "bg-green-100 text-green-700",
    intermediario: "bg-amber-100 text-amber-700",
    avancado: "bg-red-100 text-red-700"
  };

  // Apply filters and sorting
  const filteredCourses = courses.filter(applyCourseFilters);
  
  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.students_count || 0) - (a.students_count || 0);
      case "recent":
        return new Date(b.created_date) - new Date(a.created_date);
      case "price_low":
        return (a.price || 0) - (b.price || 0);
      case "price_high":
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });
  
  const paidCourses = sortedCourses.filter(c => c.price > 0);
  const freeCourses = sortedCourses.filter(c => c.price === 0);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-violet-950/50 to-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-violet-400 mb-4">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">Aurum Academy</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-violet-200 bg-clip-text text-transparent">
              Aprenda a investir com os melhores
            </h1>
            <p className="text-lg text-gray-300">
              Cursos completos para transformar você em um investidor de sucesso, 
              do básico ao avançado.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search and Sort */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Buscar por título, descrição, módulos ou aulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white pl-10 h-11"
              />
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[200px] bg-gray-900 border-gray-800 text-white h-11">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="price_low">Menor Preço</SelectItem>
                <SelectItem value="price_high">Maior Preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-gray-900 border border-gray-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white text-gray-400">Todos</TabsTrigger>
              <TabsTrigger value="investimentos" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white text-gray-400">Investimentos</TabsTrigger>
              <TabsTrigger value="formacao" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white text-gray-400">Formação</TabsTrigger>
              <TabsTrigger value="avancado" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white text-gray-400">Avançado</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-3">
            <Link to={createPageUrl("FavoriteLessons")}>
              <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white">
                <Star className="h-4 w-4 mr-2" />
                Favoritos
              </Button>
            </Link>
            <Link to={createPageUrl("MyCourses")}>
              <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Meus Cursos
              </Button>
            </Link>
          </div>
        </div>





        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                <Skeleton className="h-48 w-full bg-gray-800" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-gray-800" />
                  <Skeleton className="h-4 w-full bg-gray-800" />
                  <Skeleton className="h-10 w-full bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Cursos Pagos */}
            {paidCourses.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Cursos Pagos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paidCourses.map((course) => {
                    const discountPercent = course.original_price && course.original_price > course.price 
                      ? Math.round((1 - course.price / course.original_price) * 100)
                      : null;

                    return (
                      <Link key={course.id} to={createPageUrl(`CourseDetail?id=${course.id}`)}>
                        <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-violet-500/50 transition-all duration-300 group h-full flex flex-col">
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {course.is_featured && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Destaque
                                </Badge>
                              </div>
                            )}
                            {discountPercent && (
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-emerald-500/90 text-white border-0">
                                  {discountPercent}% OFF
                                </Badge>
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3">
                              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 backdrop-blur-sm">
                                {levelLabels[course.level] || "Iniciante"}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                              {course.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pt-4 border-t border-gray-800">
                              {course.duration_hours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-violet-400" />
                                  {course.duration_hours}h
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-violet-400" />
                                {course.students_count || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                {course.original_price && course.original_price > course.price && (
                                  <span className="text-sm text-gray-500 line-through block">
                                    R$ {course.original_price?.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-xl font-bold text-white">
                                  R$ {course.price?.toFixed(2)}
                                </span>
                              </div>
                              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                                Ver
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conteúdo Gratuito */}
            {(freeCourses.length > 0 || educationContent.length > 0) && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  Conteúdo Gratuito
                  <Badge className="bg-green-500/20 text-green-400 border-0">Grátis</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Free Courses */}
                  {freeCourses.map((course) => (
                    <Link key={course.id} to={createPageUrl(`CourseDetail?id=${course.id}`)}>
                      <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group h-full flex flex-col">
                        <div className="relative h-32 overflow-hidden">
                          <img 
                            src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400"}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-emerald-500/90 text-white border-0 text-xs">Grátis</Badge>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {course.title}
                          </h3>
                          {course.duration_hours && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-auto">
                              <Clock className="h-3 w-3 text-emerald-400" />
                              {course.duration_hours}h
                            </span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}

                  {/* Education Content */}
                  {freeCourses.map((course) => (
                    <Link key={course.id} to={createPageUrl(`FreeCourseDetail?id=${course.id}`)}>
                      <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group h-full flex flex-col">
                        <div className="relative h-32 overflow-hidden">
                          <img 
                            src={course.thumbnail_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400"}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-emerald-500/90 text-white border-0 text-xs">Grátis</Badge>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {course.title}
                          </h3>
                          <div className="text-xs text-gray-500 space-y-1 mt-auto">
                            <p>{course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} aulas</p>
                            {course.duration_hours && (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Clock className="h-3 w-3" />
                                {course.duration_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                  {educationContent.map((content) => (
                    <Link key={content.id} to={createPageUrl(`ContentDetail?id=${content.id}`)}>
                      <Card className="bg-gray-900 border-gray-800 hover:border-emerald-500/50 transition-all duration-300 group p-4 h-full flex flex-col">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2">
                              {content.title}
                            </h3>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                              {content.type === 'artigo' ? 'Artigo' : content.type === 'video' ? 'Vídeo' : 'Tutorial'}
                            </Badge>
                          </div>
                        </div>
                        {content.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 mt-auto">
                            <Clock className="h-3 w-3 text-emerald-400" />
                            {content.duration_minutes} min
                          </span>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {paidCourses.length === 0 && freeCourses.length === 0 && educationContent.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum curso encontrado</h3>
                <p className="text-gray-400">Novos cursos estão sendo preparados para você</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}