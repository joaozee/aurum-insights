import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookText, Video, Lightbulb, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import GlossarySection from "@/components/education/GlossarySection";
import ArticlesSection from "@/components/education/ArticlesSection";
import TutorialsSection from "@/components/education/TutorialsSection";

export default function Learn() {
  const [activeTab, setActiveTab] = useState("glossario");
  const [searchTerm, setSearchTerm] = useState("");
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await base44.entities.EducationContent.list();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = (type) => {
    return content.filter(item => {
      const matchesType = item.type === type;
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.short_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-16 w-full rounded-2xl bg-gray-800 mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 rounded-2xl bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Educação Financeira</h1>
              <p className="text-gray-400 text-sm">Aprenda e domine seus investimentos</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-900 border border-gray-800 p-1 rounded-xl w-full lg:w-auto grid grid-cols-3 lg:inline-grid">
              <TabsTrigger 
                value="glossario" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                <BookText className="h-4 w-4 mr-2" />
                Glossário
              </TabsTrigger>
              <TabsTrigger 
                value="artigos" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                <Video className="h-4 w-4 mr-2" />
                Artigos & Vídeos
              </TabsTrigger>
              <TabsTrigger 
                value="tutoriais" 
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Tutoriais
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {activeTab === "glossario" && (
          <GlossarySection 
            terms={filterContent("glossario")}
            searchTerm={searchTerm}
          />
        )}

        {activeTab === "artigos" && (
          <ArticlesSection 
            articles={filterContent("artigo").concat(filterContent("video"))}
          />
        )}

        {activeTab === "tutoriais" && (
          <TutorialsSection 
            tutorials={filterContent("tutorial")}
          />
        )}
      </div>
    </div>
  );
}